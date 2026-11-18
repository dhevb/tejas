"""Create one sealed TEJAS backup and verify a private remote copy.

The command refuses to run until the source session is read-only, the project
identity matches, and the destination is the approved private directory. It
never prints a credential, never uses --clean, and never deletes a remote
object. The Section AK ciphertext is not an input.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import stat
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from urllib.parse import unquote, urlparse

sys.path.insert(0, os.path.dirname(__file__))

from rclone_remote import scrubbed_env, verify_remote
from retention import (
    NAME_PATTERN,
    RetentionRejected,
    manifest_line,
    refuse_existing,
)
from seal_backup import seal


class PipelineRejected(RetentionRejected):
    """The backup pipeline stopped before or after a protected step."""


PROJECT_REF = "zapccpipwxduzlnvjdmy"
PG_DUMP = "/usr/lib/postgresql/17/bin/pg_dump"
PSQL = "/usr/lib/postgresql/17/bin/psql"
IDENTITY_SQL = """
SET default_transaction_read_only = on;
BEGIN READ ONLY;
SELECT 'transaction_read_only|' || current_setting('transaction_read_only');
SELECT 'current_database|' || current_database();
SELECT 'server_version|' || current_setting('server_version');
SELECT 'ssl|' || current_setting('ssl');
SELECT 'inet_server_addr|' || COALESCE(inet_server_addr()::text, '');
COMMIT;
"""


def source_is_project(host: str, user: str) -> None:
    if PROJECT_REF not in (host or "") and PROJECT_REF not in (user or ""):
        raise PipelineRejected("source is not the TEJAS project")


def identity_accepted(rows: dict[str, str]) -> None:
    if rows.get("transaction_read_only") != "on":
        raise PipelineRejected("session is not read only")
    if rows.get("current_database") != "postgres":
        raise PipelineRejected("source database was not verified")
    if not str(rows.get("server_version", "")).startswith("17."):
        raise PipelineRejected("server version was not verified")
    if rows.get("ssl") != "on":
        raise PipelineRejected("source connection is not using tls")
    address = rows.get("inet_server_addr", "")
    if address == "" or address == "socket" or address.startswith(("127.", "::1")):
        raise PipelineRejected("source is not the remote project server")


def parse_identity(text: str) -> dict[str, str]:
    rows = {}
    for line in text.splitlines():
        if "|" not in line:
            continue
        key, value = line.split("|", 1)
        rows[key.strip()] = value.strip()
    return rows


def backup_name(stamp: str) -> str:
    name = f"tejas-{PROJECT_REF}-{stamp}.dump.seal"
    if not NAME_PATTERN.fullmatch(name):
        raise PipelineRejected("backup name rejected")
    return name


def dump_argv(host: str, port: int, user: str, output: str) -> list[str]:
    source_is_project(host, user)
    argv = [PG_DUMP, "--format=custom", "--no-password", "-h", host, "-p", str(port), "-U", user, "-d", "postgres", "-f", output]
    if any(flag in argv for flag in ("--clean", "--no-owner", "--no-acl")):
        raise PipelineRejected("dump flags rejected")
    return argv


def compare_checksums(local_digest: str, remote_digest: str) -> None:
    if len(local_digest) != 64 or local_digest != remote_digest:
        raise PipelineRejected("remote checksum mismatch")


def _scrub(text: str, secrets: list[str]) -> str:
    for secret in secrets:
        if secret:
            text = text.replace(secret, "[redacted]")
    return text


def _runner(environ: dict[str, str]):
    raw_url = environ.get("SUPABASE_BACKUP_DB_URL", "")
    secrets = [
        raw_url,
        environ.get("TEJAS_BACKUP_ENCRYPTION_PASSPHRASE", ""),
        environ.get("TEJAS_RCLONE_CONFIG_B64", ""),
    ]
    try:
        secrets.append(unquote(urlparse(raw_url).password or ""))
    except ValueError:
        pass

    def run(argv: list[str], env: dict[str, str]) -> subprocess.CompletedProcess[str]:
        completed = subprocess.run(argv, env=env, text=True, capture_output=True, check=False)
        if completed.returncode != 0 and os.path.basename(argv[0]) != "rclone":
            print(_scrub(completed.stderr, secrets), file=sys.stderr)
        return completed

    return run


def execute_backup(environ: dict[str, str], run, rclone: str, work: str, stamp: str) -> int:
    config_path = os.path.join(work, "rclone.conf")
    plain = os.path.join(work, "plain.dump")
    sealed = ""
    downloaded = os.path.join(work, "remote.seal")
    try:
        directory = verify_remote(environ, run, rclone, work)
        raw_url = environ["SUPABASE_BACKUP_DB_URL"]
        passphrase = environ["TEJAS_BACKUP_ENCRYPTION_PASSPHRASE"].encode()
        parsed = urlparse(raw_url)
        password = unquote(parsed.password or "")
        host = parsed.hostname or ""
        user = parsed.username or ""
        source_is_project(host, user)
        if not password or parsed.scheme not in {"postgresql", "postgres"}:
            raise PipelineRejected("source connection was not verified")
        db_env = scrubbed_env(environ, config_path, password)
        identity = run(
            [PSQL, "-X", "-v", "ON_ERROR_STOP=1", "-A", "-t", "-h", host, "-p", str(parsed.port or 5432), "-U", user, "-d", "postgres", "-c", IDENTITY_SQL],
            db_env,
        )
        if identity.returncode != 0:
            raise PipelineRejected("command failed")
        identity_accepted(parse_identity(identity.stdout))
        name = backup_name(stamp)
        remote_env = scrubbed_env(environ, config_path)
        present = run([rclone, "lsf", directory], remote_env)
        if present.returncode != 0:
            raise PipelineRejected("command failed")
        refuse_existing(present.stdout, name)
        sealed = os.path.join(work, name)
        dumped = run(dump_argv(host, parsed.port or 5432, user, plain), db_env)
        if dumped.returncode != 0:
            raise PipelineRejected("command failed")
        blob = seal(open(plain, "rb").read(), passphrase)
        _wipe(plain)
        descriptor = os.open(sealed, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(blob)
        digest = hashlib.sha256(blob).hexdigest()
        destination = directory + name
        uploaded = run([rclone, "copyto", sealed, destination], remote_env)
        if uploaded.returncode != 0:
            raise PipelineRejected("command failed")
        fetched = run([rclone, "copyto", destination, downloaded], remote_env)
        if fetched.returncode != 0:
            raise PipelineRejected("command failed")
        remote_digest = hashlib.sha256(open(downloaded, "rb").read()).hexdigest()
        compare_checksums(digest, remote_digest)
        print(manifest_line(name, digest, len(blob)))
        print("remote_match true")
        return 0
    except (PipelineRejected, RetentionRejected) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except OSError:
        print("backup file is not readable", file=sys.stderr)
        return 2
    finally:
        for path in (config_path, plain, sealed, downloaded):
            if path:
                try:
                    _wipe(path)
                except OSError:
                    pass


def run_backup() -> int:
    rclone = os.environ.get("RCLONE_BIN") or shutil.which("rclone") or ""
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    with tempfile.TemporaryDirectory(prefix="tejas-backup-") as work:
        os.chmod(work, 0o700)
        return execute_backup(dict(os.environ), _runner(os.environ), rclone, work, stamp)


def _wipe(path: str) -> None:
    if not path or not os.path.exists(path):
        return
    size = os.path.getsize(path)
    with open(path, "r+b") as handle:
        handle.write(b"\x00" * size)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
    os.remove(path)


def main(argv: list[str] | None = None) -> int:
    if argv:
        print("this command does not accept arguments", file=sys.stderr)
        return 2
    return run_backup()


if __name__ == "__main__":
    raise SystemExit(main())
