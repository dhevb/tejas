"""Fail closed before any production backup command.

`secrets` checks that the required names are present and that the destination
is the approved directory. `remote` installs no credentials of its own: it
writes the supplied config with mode 0600, requires the remote name
`tejasdrive`, and lists the destination. Neither command contacts the database.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

from rclone_remote import verify_remote
from retention import RetentionRejected, missing_secrets, validate_directory


def _run(argv: list[str], env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(argv, env=env, text=True, capture_output=True, check=False)


def secrets_ready() -> int:
    missing = missing_secrets(os.environ)
    if missing:
        print("required secret is absent: " + ",".join(missing), file=sys.stderr)
        return 2
    try:
        validate_directory(os.environ["TEJAS_BACKUP_DESTINATION"])
    except RetentionRejected as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print("secrets accepted")
    return 0


def remote_ready_on_runner() -> int:
    rclone = os.environ.get("RCLONE_BIN") or shutil.which("rclone") or ""
    with tempfile.TemporaryDirectory(prefix="tejas-rclone-") as work:
        os.chmod(work, 0o700)
        config_path = os.path.join(work, "rclone.conf")
        try:
            verify_remote(os.environ, _run, rclone, work)
        except RetentionRejected as exc:
            print(str(exc), file=sys.stderr)
            return 2
        finally:
            if os.path.exists(config_path):
                size = os.path.getsize(config_path)
                with open(config_path, "r+b") as handle:
                    handle.write(b"\x00" * size)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.remove(config_path)
    print("preflight accepted")
    return 0


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if args in ([], ["secrets"]):
        return secrets_ready()
    if args == ["remote"]:
        return remote_ready_on_runner()
    print("this command does not accept arguments", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
