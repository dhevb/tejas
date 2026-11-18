"""Use the existing tejasdrive config on an ephemeral runner.

The configuration arrives as base64 and is written with mode 0600. This module
does not create a remote, print a token, or contact a database.
"""

from __future__ import annotations

import base64
import os
import stat

from retention import RetentionRejected, missing_secrets, remote_ready, validate_directory


class RemoteRejected(RetentionRejected):
    """The runner could not use the existing tejasdrive remote."""


RCLONE_VERSION = "v1.76.0"
RCLONE_SHA256 = "b00f00b3266c3764413afe599d3ec316f6f43b3e0ea8a0bc1d186d2133e46df7"
REMOTE_NAME = "tejasdrive"
CONFIG_FILENAME = "rclone.conf"


def remote_names(text: str) -> list[str]:
    names = []
    for line in text.splitlines():
        stripped = line.strip()
        if len(stripped) >= 3 and stripped.startswith("[") and stripped.endswith("]"):
            names.append(stripped[1:-1].strip())
    return names


def decode_config(encoded: str) -> bytes:
    if not isinstance(encoded, str) or not encoded.strip():
        raise RemoteRejected("required secret is absent: TEJAS_RCLONE_CONFIG_B64")
    try:
        payload = base64.b64decode(encoded.strip(), validate=True)
    except (ValueError, TypeError):
        raise RemoteRejected("rclone configuration was rejected") from None
    if not payload or b"\x00" in payload:
        raise RemoteRejected("rclone configuration was rejected")
    try:
        text = payload.decode("utf-8")
    except UnicodeDecodeError:
        raise RemoteRejected("rclone configuration was rejected") from None
    if REMOTE_NAME not in remote_names(text):
        raise RemoteRejected("tejasdrive is not configured")
    return payload


def write_config(payload: bytes, directory: str) -> str:
    path = os.path.join(directory, CONFIG_FILENAME)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        os.fchmod(descriptor, 0o600)
        os.write(descriptor, payload)
    finally:
        os.close(descriptor)
    if stat.S_IMODE(os.stat(path).st_mode) != 0o600:
        raise RemoteRejected("rclone configuration was rejected")
    return path


def scrubbed_env(environ: dict[str, str], config_path: str, password: str | None = None) -> dict[str, str]:
    env = {
        key: value
        for key, value in environ.items()
        if not key.startswith(("SUPABASE_", "TEJAS_")) and key not in {"PGPASSWORD", "RCLONE_CONFIG"}
    }
    env["RCLONE_CONFIG"] = config_path
    if password is not None:
        env["PGPASSWORD"] = password
        env["PGSSLMODE"] = "require"
        env["PGCONNECT_TIMEOUT"] = "20"
    return env


def verify_remote(environ: dict[str, str], run, rclone: str, work: str) -> str:
    missing = missing_secrets(environ)
    if missing:
        raise RemoteRejected("required secret is absent: " + ",".join(missing))
    directory = validate_directory(environ["TEJAS_BACKUP_DESTINATION"])
    payload = decode_config(environ["TEJAS_RCLONE_CONFIG_B64"])
    path = write_config(payload, work)
    if not rclone or not os.path.isfile(rclone):
        raise RemoteRejected("rclone is not installed")
    env = scrubbed_env(environ, path)
    listed = run([rclone, "listremotes"], env)
    if listed.returncode != 0:
        raise RemoteRejected("command failed")
    remote_ready(listed.stdout.splitlines())
    probe = run([rclone, "lsf", directory], env)
    if probe.returncode != 0:
        raise RemoteRejected("command failed")
    return directory
