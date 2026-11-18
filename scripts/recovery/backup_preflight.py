"""Fail closed before any production backup command.

The workflow calls this script. It prints missing secret names and safety
rejections. It does not print secret values, run pg_dump, or upload a file.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))

from retention import RetentionRejected, missing_secrets, remote_ready, validate_destination


def main() -> int:
    missing = missing_secrets(os.environ)
    if missing:
        print("required secret is absent: " + ",".join(missing), file=sys.stderr)
        return 2
    try:
        validate_destination(os.environ["TEJAS_BACKUP_DESTINATION"])
    except RetentionRejected as exc:
        print(str(exc), file=sys.stderr)
        return 2
    rclone = shutil.which("rclone")
    if rclone is None:
        print("rclone is not installed", file=sys.stderr)
        return 2
    completed = subprocess.run([rclone, "listremotes"], text=True, capture_output=True, check=False)
    if completed.returncode != 0:
        print("rclone could not list remotes", file=sys.stderr)
        return 2
    try:
        remote_ready(completed.stdout.splitlines())
    except RetentionRejected as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print("preflight accepted; no backup command was run")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
