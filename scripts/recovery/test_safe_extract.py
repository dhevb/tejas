import hashlib
import os
import stat
import tarfile
import tempfile
import unittest
from pathlib import Path

from safe_extract import ArchiveRejected, extract_allowlist, inspect_members, make_fixture


ALLOWED_FILE = "bucket/item.txt"
ALLOWED = {ALLOWED_FILE: ""}
DIRS = {"bucket", "bucket/"}
PAYLOAD = b"tejas-recovery-fixture"


def digest(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


class SafeExtractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.work = Path(self.tmp.name)
        self.archive = self.work / "fixture.tar"
        self.dest = self.work / "out"
        self.allowed = {ALLOWED_FILE: digest(PAYLOAD)}

    def tearDown(self):
        self.tmp.cleanup()

    def members(self, entries):
        make_fixture(self.archive, entries)
        return inspect_members(self.archive, set(self.allowed), DIRS)

    def test_allowlisted_file_is_extracted_and_hashed(self):
        make_fixture(self.archive, [
            ("bucket/", b"", tarfile.DIRTYPE, ""),
            (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
        ])
        result = extract_allowlist(self.archive, self.dest, self.allowed, DIRS)
        self.assertEqual(result[ALLOWED_FILE], digest(PAYLOAD))
        written = self.dest / "bucket" / "item.txt"
        self.assertEqual(written.read_bytes(), PAYLOAD)
        self.assertTrue(stat.S_ISREG(written.lstat().st_mode))
        self.assertEqual(stat.S_IMODE(written.lstat().st_mode), 0o600)

    def test_absolute_path_is_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([("/tmp/item.txt", PAYLOAD, tarfile.REGTYPE, "")])

    def test_parent_traversal_is_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([("bucket/../../item.txt", PAYLOAD, tarfile.REGTYPE, "")])

    def test_symlink_is_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([(ALLOWED_FILE, b"", tarfile.SYMTYPE, "/tmp/sentinel")])

    def test_hardlink_is_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([
                (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
                ("bucket/link.txt", b"", tarfile.LNKTYPE, ALLOWED_FILE),
            ])

    def test_fifo_and_device_are_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([(ALLOWED_FILE, b"", tarfile.FIFOTYPE, "")])
        with self.assertRaises(ArchiveRejected):
            self.members([(ALLOWED_FILE, b"", tarfile.CHRTYPE, "")])

    def test_duplicate_and_unexpected_members_are_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([
                (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
                (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
            ])
        with self.assertRaises(ArchiveRejected):
            self.members([
                (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
                ("bucket/extra.txt", b"no", tarfile.REGTYPE, ""),
            ])

    def test_checksum_mismatch_removes_the_destination(self):
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        wrong = {ALLOWED_FILE: "0" * 64}
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, wrong, DIRS)
        self.assertFalse(self.dest.exists())

    def test_existing_destination_is_rejected(self):
        self.dest.mkdir()
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, self.allowed, DIRS)

    def test_malformed_archive_is_rejected(self):
        self.archive.write_bytes(b"not a tar archive")
        with self.assertRaises(ArchiveRejected):
            inspect_members(self.archive, set(self.allowed), DIRS)

    def test_missing_required_file_is_rejected(self):
        make_fixture(self.archive, [("bucket/", b"", tarfile.DIRTYPE, "")])
        with self.assertRaises(ArchiveRejected):
            inspect_members(self.archive, set(self.allowed), DIRS)

    def test_extraction_does_not_write_outside_the_destination(self):
        sentinel = self.work / "sentinel"
        sentinel.write_text("keep")
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        extract_allowlist(self.archive, self.dest, self.allowed, DIRS)
        self.assertEqual(sentinel.read_text(), "keep")
        outside = list(self.work.rglob("item.txt"))
        self.assertEqual(outside, [self.dest / "bucket" / "item.txt"])


if __name__ == "__main__":
    unittest.main()
