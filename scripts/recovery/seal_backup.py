"""Authenticated encryption for a future TEJAS backup generation.

The Section AK archive stays OpenSSL AES-256-CBC. This module does not open
that archive and does not replace its passphrase. A new generation uses
AES-256-GCM with PBKDF2-HMAC-SHA256. OpenSSL's enc command on this host
rejects AES-GCM, so the operation uses the installed cryptography library.
"""

from __future__ import annotations

import argparse
import os
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


class SealRejected(Exception):
    """The sealed backup could not be opened."""


MAGIC = b"TEJAS1\n"
SALT_LEN = 16
NONCE_LEN = 12
ITERATIONS = 600_000


def _key(passphrase: bytes, salt: bytes, iterations: int) -> bytes:
    if not passphrase:
        raise SealRejected("passphrase is empty")
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iterations)
    return kdf.derive(passphrase)


def seal(plaintext: bytes, passphrase: bytes, iterations: int = ITERATIONS) -> bytes:
    salt = os.urandom(SALT_LEN)
    nonce = os.urandom(NONCE_LEN)
    body = AESGCM(_key(passphrase, salt, iterations)).encrypt(nonce, plaintext, MAGIC)
    return MAGIC + salt + nonce + body


def open_sealed(blob: bytes, passphrase: bytes, iterations: int = ITERATIONS) -> bytes:
    if not blob.startswith(MAGIC):
        raise SealRejected("not a TEJAS1 seal")
    rest = blob[len(MAGIC):]
    if len(rest) < SALT_LEN + NONCE_LEN + 16:
        raise SealRejected("seal is truncated")
    salt = rest[:SALT_LEN]
    nonce = rest[SALT_LEN:SALT_LEN + NONCE_LEN]
    body = rest[SALT_LEN + NONCE_LEN:]
    try:
        return AESGCM(_key(passphrase, salt, iterations)).decrypt(nonce, body, MAGIC)
    except Exception as exc:
        raise SealRejected("seal authentication failed") from exc


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seal or open a future TEJAS backup generation.")
    parser.add_argument("command", choices=("seal", "open"))
    parser.add_argument("--in", dest="source", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--pass-file", required=True)
    args = parser.parse_args(argv)
    passphrase = open(args.pass_file, "rb").read()
    if passphrase.endswith(b"\n"):
        print("passphrase file has a trailing newline", file=sys.stderr)
        return 2
    try:
        payload = open(args.source, "rb").read()
        if args.command == "seal":
            result = seal(payload, passphrase)
        else:
            result = open_sealed(payload, passphrase)
    except SealRejected as exc:
        print(str(exc), file=sys.stderr)
        return 2
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    descriptor = os.open(args.out, flags, 0o600)
    with os.fdopen(descriptor, "wb") as handle:
        handle.write(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
