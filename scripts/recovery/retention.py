"""Fail-closed checks for TEJAS backup retention.

This module does not upload a backup, create a remote, or read a credential
value. A copy stays refused until the approved private remote is configured.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from datetime import datetime, timezone


class RetentionRejected(Exception):
    """The retention request failed a safety check. Nothing was copied."""


APPROVED_PREFIX = "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/"
NAME_PATTERN = re.compile(r"^tejas-zapccpipwxduzlnvjdmy-\d{8}T\d{6}Z\.dump\.(enc|age|seal)$")
SECRET_NAMES = (
    "SUPABASE_BACKUP_DB_URL",
    "TEJAS_BACKUP_ENCRYPTION_PASSPHRASE",
    "TEJAS_BACKUP_DESTINATION",
    "TEJAS_RCLONE_CONFIG_B64",
)


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_local(path: str, expected: str) -> None:
    if not re.fullmatch(r"[0-9a-f]{64}", expected):
        raise RetentionRejected("expected checksum is not lowercase sha256")
    if sha256_file(path) != expected:
        raise RetentionRejected("checksum mismatch")


def _file_size(path: str) -> int:
    with open(path, "rb") as handle:
        handle.seek(0, 2)
        return handle.tell()


def validate_destination(destination: str) -> str:
    if not isinstance(destination, str) or destination == "" or "\n" in destination or "\x00" in destination:
        raise RetentionRejected("destination rejected")
    if destination.startswith(("http://", "https://", "s3://", "gs://")):
        raise RetentionRejected("destination rejected")
    if ".." in destination or not destination.startswith(APPROVED_PREFIX):
        raise RetentionRejected("destination rejected")
    name = destination[len(APPROVED_PREFIX):]
    if "/" in name or not NAME_PATTERN.fullmatch(name):
        raise RetentionRejected("destination rejected")
    return name


def validate_directory(destination: str) -> str:
    if not isinstance(destination, str) or "\n" in destination or "\x00" in destination or ".." in destination:
        raise RetentionRejected("destination rejected")
    if destination.strip().rstrip("/") != APPROVED_PREFIX.rstrip("/"):
        raise RetentionRejected("destination rejected")
    return APPROVED_PREFIX


def manifest_line(name: str, digest: str, size: int) -> str:
    if not NAME_PATTERN.fullmatch(name) or not re.fullmatch(r"[0-9a-f]{64}", digest) or not isinstance(size, int) or size < 0:
        raise RetentionRejected("manifest rejected")
    return f"{digest}  {size}  {name}"


def refuse_existing(listing: str, name: str) -> None:
    present = {line.strip() for line in listing.splitlines() if line.strip()}
    if name in present:
        raise RetentionRejected("destination object already exists")


def delete_backup(name: str) -> None:
    raise RetentionRejected("backup deletion is not permitted")


def remote_ready(remotes: list[str]) -> None:
    names = {item.strip().rstrip(":") for item in remotes if item.strip()}
    if "tejasdrive" not in names:
        raise RetentionRejected("tejasdrive is not configured")


def missing_secrets(environ: dict[str, str]) -> list[str]:
    return [name for name in SECRET_NAMES if not environ.get(name, "").strip()]


def plan_rotation(names: list[str], keep: int) -> tuple[list[str], list[str]]:
    if keep < 1:
        raise RetentionRejected("keep must be at least 1")
    for name in names:
        if not NAME_PATTERN.fullmatch(name):
            raise RetentionRejected("rotation name rejected")
    ordered = sorted(names)
    return ordered[-keep:], ordered[:-keep]


def age_hours(created: datetime, now: datetime) -> float:
    if created.tzinfo is None or now.tzinfo is None:
        raise RetentionRejected("timestamps must carry a timezone")
    return (now.astimezone(timezone.utc) - created.astimezone(timezone.utc)).total_seconds() / 3600


def age_status(created: datetime, now: datetime, max_hours: float) -> str:
    if max_hours <= 0:
        raise RetentionRejected("maximum age must be positive")
    return "PASS" if age_hours(created, now) <= max_hours else "STALE"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check TEJAS backup retention without uploading.")
    sub = parser.add_subparsers(dest="command", required=True)
    verify = sub.add_parser("verify-local")
    verify.add_argument("--file", required=True)
    verify.add_argument("--sha256", required=True)
    preflight = sub.add_parser("preflight")
    preflight.add_argument("--destination", required=True)
    preflight.add_argument("--remote", action="append", default=[])
    plan = sub.add_parser("plan")
    plan.add_argument("--keep", type=int, required=True)
    plan.add_argument("--name", action="append", default=[])
    args = parser.parse_args(argv)
    try:
        if args.command == "verify-local":
            size = _file_size(args.file)
            verify_local(args.file, args.sha256)
            print(f"match bytes={size}")
        elif args.command == "preflight":
            validate_destination(args.destination)
            remote_ready(args.remote)
            print("destination accepted")
        else:
            kept, dropped = plan_rotation(args.name, args.keep)
            print("keep " + ",".join(kept))
            print("would_drop " + ",".join(dropped))
            print("deleted 0")
    except RetentionRejected as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except OSError:
        print("backup file is not readable", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
