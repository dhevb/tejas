"""Future standard for TEJAS recovery-archive extraction.

This tool is not the unrecovered historical tar command. It never calls
``tar -x``. Every member is classified before a payload is written. Archive
ownership and permission bits are not copied. Extracted files are mode 0600.

Example:

    python3 scripts/recovery/safe_extract.py \\
      --archive archive.tar \\
      --destination /path/to/new-directory \\
      --allow bucket/item.txt:<64-lowercase-hex-sha256> \\
      --allow-dir bucket
"""

from __future__ import annotations

import argparse
import hashlib
import io
import os
import stat
import sys
import tarfile
from pathlib import Path


class ArchiveRejected(Exception):
    """The archive failed a safety check. Nothing was extracted."""


def _parts(name: str) -> list[str]:
    return [part for part in name.split("/") if part != ""]


def _normalized(name: str) -> str:
    return "/".join(_parts(name))


def _valid_digest(value: object) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _check_allowlist(allowed_files: dict[str, str], allowed_dirs: set[str]) -> None:
    if not allowed_files:
        raise ArchiveRejected("allowlist is empty")
    for name, digest in allowed_files.items():
        _reject_name(name)
        if not _valid_digest(digest):
            raise ArchiveRejected("expected checksum is not lowercase sha256")
    for name in allowed_dirs:
        _reject_name(name.rstrip("/"))


def _reject_symlink_path(path: Path) -> None:
    current = path
    while True:
        if os.path.islink(current):
            raise ArchiveRejected("symlink in destination path")
        parent = current.parent
        if parent == current:
            return
        current = parent


def _reject_name(name: str) -> None:
    if not isinstance(name, str) or name == "" or "\x00" in name:
        raise ArchiveRejected("unsafe member name")
    if name.startswith(("/", "\\")) or ":" in name:
        raise ArchiveRejected("absolute member name")
    parts = _parts(name)
    if not parts or any(part in {".", ".."} for part in parts):
        raise ArchiveRejected("path traversal")


def _reject_type(member: tarfile.TarInfo) -> str:
    if member.issym() or member.islnk() or member.type in {tarfile.SYMTYPE, tarfile.LNKTYPE}:
        raise ArchiveRejected("link member")
    if member.isdev() or member.ischr() or member.isblk() or member.isfifo():
        raise ArchiveRejected("special member")
    if member.type == tarfile.DIRTYPE:
        return "directory"
    if member.type in {tarfile.REGTYPE, tarfile.AREGTYPE}:
        return "file"
    raise ArchiveRejected("unexpected member type")


def inspect_members(archive_path: str | Path, allowed_files: set[str], allowed_dirs: set[str]) -> list[tuple[str, str, int]]:
    """Return ``(name, kind, size)`` for a safe archive. Raise before extraction."""
    path = Path(archive_path)
    if path.is_symlink() or not path.is_file():
        raise ArchiveRejected("archive is missing or not a regular file")
    try:
        handle = tarfile.open(path, "r:")
    except (tarfile.TarError, OSError) as exc:
        raise ArchiveRejected("malformed archive") from exc
    seen: set[str] = set()
    seen_paths: set[str] = set()
    listed: list[tuple[str, str, int]] = []
    try:
        members = handle.getmembers()
        if not members:
            raise ArchiveRejected("empty archive")
        for member in members:
            name = member.name
            if name in seen:
                raise ArchiveRejected("duplicate member")
            seen.add(name)
            _reject_name(name)
            normal = _normalized(name)
            if normal in seen_paths:
                raise ArchiveRejected("duplicate path")
            seen_paths.add(normal)
            kind = _reject_type(member)
            allowed = allowed_files if kind == "file" else allowed_dirs
            if name not in allowed:
                raise ArchiveRejected("unexpected member")
            listed.append((name, kind, member.size if kind == "file" else 0))
    finally:
        handle.close()
    missing = sorted(allowed_files - seen)
    if missing:
        raise ArchiveRejected("required member missing")
    return listed


def extract_allowlist(
    archive_path: str | Path,
    destination: str | Path,
    allowed_files: dict[str, str],
    allowed_dirs: set[str],
) -> dict[str, str]:
    """Write only allowlisted regular files into a new directory.

    ``allowed_files`` maps a member name to its expected SHA-256. The
    destination must not already exist. Returns the computed digests.
    """
    _check_allowlist(allowed_files, allowed_dirs)
    listed = inspect_members(archive_path, set(allowed_files), allowed_dirs)
    if inspect_members(archive_path, set(allowed_files), allowed_dirs) != listed:
        raise ArchiveRejected("archive changed")
    dest = Path(destination)
    if os.path.lexists(dest):
        raise ArchiveRejected("destination already exists")
    parent = dest.parent
    if not parent.is_dir() or parent.is_symlink():
        raise ArchiveRejected("destination parent is not a real directory")
    _reject_symlink_path(parent)
    dest.mkdir(mode=0o700)
    os.chmod(dest, 0o700)
    if os.path.islink(dest):
        raise ArchiveRejected("destination is a symlink")
    digests: dict[str, str] = {}
    try:
        with tarfile.open(archive_path, "r:") as handle:
            for name, kind, _size in listed:
                if kind != "file":
                    continue
                member = handle.getmember(name)
                if member.type not in {tarfile.REGTYPE, tarfile.AREGTYPE}:
                    raise ArchiveRejected("required path is not a regular file")
                target = dest.joinpath(*_parts(name))
                if dest.resolve() not in target.resolve().parents:
                    raise ArchiveRejected("extraction path escaped the destination")
                if os.path.lexists(target):
                    raise ArchiveRejected("refusing to overwrite a file")
                target.parent.mkdir(parents=True, exist_ok=True)
                stop = dest.parent.resolve()
                for directory in [target.parent, *target.parent.parents]:
                    if directory.resolve() == stop:
                        break
                    os.chmod(directory, 0o700)
                source = handle.extractfile(member)
                if source is None:
                    raise ArchiveRejected("member payload is missing")
                digest = hashlib.sha256()
                written = 0
                with open(os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), "wb") as output:
                    while written < member.size:
                        chunk = source.read(min(1024 * 1024, member.size - written))
                        if not chunk:
                            break
                        digest.update(chunk)
                        output.write(chunk)
                        written += len(chunk)
                if written != member.size:
                    raise ArchiveRejected("size mismatch")
                actual = digest.hexdigest()
                expected = allowed_files[name]
                if actual != expected:
                    raise ArchiveRejected("checksum mismatch")
                info = target.lstat()
                if stat.S_ISLNK(info.st_mode) or not stat.S_ISREG(info.st_mode):
                    raise ArchiveRejected("extracted path is not a regular file")
                digests[name] = actual
    except ArchiveRejected:
        _remove_tree(dest)
        raise
    except (tarfile.TarError, OSError) as exc:
        _remove_tree(dest)
        raise ArchiveRejected("malformed archive") from exc
    return digests


def _remove_tree(path: Path) -> None:
    if not os.path.lexists(path):
        return
    for child in sorted(path.rglob("*"), reverse=True):
        if child.is_symlink() or child.is_file():
            child.unlink()
        elif child.is_dir():
            child.rmdir()
    path.rmdir()


def make_fixture(path: Path, members: list[tuple[str, bytes, str, str]], mode: int = 0o644) -> None:
    """Test helper. Each member is ``(name, payload, type, linkname)``."""
    with tarfile.open(path, "w") as handle:
        for name, payload, type_, linkname in members:
            info = tarfile.TarInfo(name)
            info.type = type_
            info.linkname = linkname
            info.mode = mode
            info.size = len(payload) if type_ in {tarfile.REGTYPE, tarfile.AREGTYPE} else 0
            handle.addfile(info, io.BytesIO(payload) if info.size else None)


def main(argv: list[str] | None = None) -> int:
    """Command line for the future extraction standard. Prints no secrets."""
    parser = argparse.ArgumentParser(
        prog="safe_extract.py",
        description="Extract an allowlisted tar without tar -x. This is not the historical tar command.",
    )
    parser.add_argument("--archive", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--allow", action="append", required=True, metavar="PATH:SHA256")
    parser.add_argument("--allow-dir", action="append", default=[], metavar="PATH")
    args = parser.parse_args(argv)
    allowed: dict[str, str] = {}
    for entry in args.allow:
        member_name, separator, digest = entry.rpartition(":")
        if separator != ":" or member_name == "":
            print("allow entry must be path:sha256", file=sys.stderr)
            return 2
        allowed[member_name] = digest
    try:
        extracted = extract_allowlist(args.archive, args.destination, allowed, set(args.allow_dir))
    except ArchiveRejected as exc:
        print(str(exc), file=sys.stderr)
        return 1
    for name, digest in extracted.items():
        print(f"{digest}  {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
