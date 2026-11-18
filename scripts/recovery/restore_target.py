"""Refuse a database restore unless the target is an isolated local database."""

from __future__ import annotations

import argparse
import sys


class RestoreRejected(Exception):
    """The restore target is not an isolated database."""


ALLOWED_HOSTS = frozenset({"127.0.0.1", "::1", "/var/run/postgresql"})


def assert_isolated(host: str, database: str) -> None:
    if not isinstance(host, str) or host not in ALLOWED_HOSTS:
        raise RestoreRejected("host is not an isolated socket or loopback address")
    if not isinstance(database, str) or database == "" or database == "postgres":
        raise RestoreRejected("postgres is not a restore target")
    if not database.replace("_", "").isalnum() or database.startswith("pg_"):
        raise RestoreRejected("database name rejected")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check an isolated restore target.")
    parser.add_argument("--host", required=True)
    parser.add_argument("--database", required=True)
    args = parser.parse_args(argv)
    try:
        assert_isolated(args.host, args.database)
    except RestoreRejected as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print("isolated target accepted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
