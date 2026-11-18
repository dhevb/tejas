"""Hardened tar inspection and extraction.

This is a new recovery tool. It is not the historical tar command, and it does
not call ``tar -x``. Members are classified before any payload is written.
"""

from __future__ import annotations

import hashlib
import io
import os
import stat
import tarfile
from pathlib import Path


class ArchiveRejected(Exception):
    """The archive failed a safety check. Nothing was extracted."""


def _parts(name: str) -> list[str]:
    return [part for part in name.split("/") if part != ""]


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
    if member.isdir():
        return "directory"
    if member.isreg() or member.type in {tarfile.REGTYPE, tarfile.AREGTYPE}:
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
    listed = inspect_members(archive_path, set(allowed_files), allowed_dirs)
    dest = Path(destination)
    if os.path.lexists(dest):
        raise ArchiveRejected("destination already exists")
    parent = dest.parent
    if parent.is_symlink() or not parent.is_dir():
        raise ArchiveRejected("destination parent is not a real directory")
    dest.mkdir(mode=0o700)
    digests: dict[str, str] = {}
    try:
        with tarfile.open(archive_path, "r:") as handle:
            for name, kind, _size in listed:
                if kind != "file":
                    continue
                member = handle.getmember(name)
                if not member.isreg():
                    raise ArchiveRejected("required path is not a regular file")
                target = dest.joinpath(*_parts(name))
                if dest.resolve() not in target.resolve().parents:
                    raise ArchiveRejected("extraction path escaped the destination")
                if os.path.lexists(target):
                    raise ArchiveRejected("refusing to overwrite a file")
                target.parent.mkdir(parents=True, exist_ok=True)
                source = handle.extractfile(member)
                if source is None:
                    raise ArchiveRejected("member payload is missing")
                digest = hashlib.sha256()
                with open(os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), "wb") as output:
                    while True:
                        chunk = source.read(1024 * 1024)
                        if not chunk:
                            break
                        digest.update(chunk)
                        output.write(chunk)
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


def make_fixture(path: Path, members: list[tuple[str, bytes, str, str]]) -> None:
    """Test helper. Each member is ``(name, payload, type, linkname)``."""
    with tarfile.open(path, "w") as handle:
        for name, payload, type_, linkname in members:
            info = tarfile.TarInfo(name)
            info.type = type_
            info.linkname = linkname
            info.size = len(payload) if type_ in {tarfile.REGTYPE, tarfile.AREGTYPE} else 0
            handle.addfile(info, io.BytesIO(payload) if info.size else None)
