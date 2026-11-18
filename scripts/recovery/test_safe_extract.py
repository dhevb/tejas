import contextlib
import hashlib
import io
import stat
import tarfile
import tempfile
import unittest
from pathlib import Path

from safe_extract import ArchiveRejected, extract_allowlist, inspect_members, main, make_fixture


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

    def test_archive_mode_is_not_copied(self):
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")], mode=0o777)
        extract_allowlist(self.archive, self.dest, self.allowed, DIRS)
        written = self.dest / "bucket" / "item.txt"
        self.assertEqual(stat.S_IMODE(written.lstat().st_mode), 0o600)
        self.assertEqual(stat.S_IMODE((self.dest / "bucket").lstat().st_mode), 0o700)

    def test_dot_segment_drive_letter_and_backslash_are_rejected(self):
        for name in ("bucket/./item.txt", "C:/item.txt", "\\item.txt"):
            with self.assertRaises(ArchiveRejected):
                self.members([(name, PAYLOAD, tarfile.REGTYPE, "")])

    def test_null_byte_name_is_rejected(self):
        with self.assertRaises((ArchiveRejected, ValueError, OSError, tarfile.TarError)):
            self.members([("bucket/it\x00em.txt", PAYLOAD, tarfile.REGTYPE, "")])

    def test_block_device_and_continuation_are_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([(ALLOWED_FILE, b"", tarfile.BLKTYPE, "")])
        with self.assertRaises(ArchiveRejected):
            self.members([(ALLOWED_FILE, b"", tarfile.CONTTYPE, "")])

    def test_unexpected_directory_is_rejected(self):
        with self.assertRaises(ArchiveRejected):
            self.members([
                (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
                ("other/", b"", tarfile.DIRTYPE, ""),
            ])

    def test_normalized_duplicate_does_not_create_the_destination(self):
        make_fixture(self.archive, [
            (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
            ("bucket//item.txt", PAYLOAD, tarfile.REGTYPE, ""),
        ])
        allowed = dict(self.allowed)
        allowed["bucket//item.txt"] = digest(PAYLOAD)
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, allowed, DIRS)
        self.assertFalse(self.dest.exists())

    def test_empty_allowlist_and_uppercase_checksum_are_rejected(self):
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, {}, set())
        uppercase = {ALLOWED_FILE: digest(PAYLOAD).upper()}
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, uppercase, DIRS)
        self.assertFalse(self.dest.exists())

    def test_truncated_archive_is_rejected(self):
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        self.archive.write_bytes(self.archive.read_bytes()[:80])
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, self.allowed, DIRS)
        self.assertFalse(self.dest.exists())

    def test_symlink_archive_and_destination_are_rejected(self):
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        linked = self.work / "linked.tar"
        linked.symlink_to(self.archive)
        with self.assertRaises(ArchiveRejected):
            inspect_members(linked, set(self.allowed), DIRS)
        self.dest.symlink_to(self.work / "elsewhere")
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, self.dest, self.allowed, DIRS)

    def test_symlink_ancestor_is_rejected_and_writes_nothing(self):
        real = self.work / "real"
        real.mkdir()
        link = self.work / "link"
        link.symlink_to(real, target_is_directory=True)
        nested = link / "nested"
        nested.mkdir()
        make_fixture(self.archive, [(ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, "")])
        with self.assertRaises(ArchiveRejected):
            extract_allowlist(self.archive, nested / "out", self.allowed, DIRS)
        self.assertEqual(list(real.rglob("*")), [real / "nested"])

    def test_cli_extracts_allowlist_and_rejects_a_bad_checksum(self):
        make_fixture(self.archive, [
            ("bucket/", b"", tarfile.DIRTYPE, ""),
            (ALLOWED_FILE, PAYLOAD, tarfile.REGTYPE, ""),
        ])
        with contextlib.redirect_stdout(io.StringIO()):
            code = main([
                "--archive", str(self.archive),
                "--destination", str(self.dest),
                "--allow", f"{ALLOWED_FILE}:{digest(PAYLOAD)}",
                "--allow-dir", "bucket",
                "--allow-dir", "bucket/",
            ])
        self.assertEqual(code, 0)
        self.assertEqual((self.dest / "bucket" / "item.txt").read_bytes(), PAYLOAD)
        second = self.work / "out2"
        with contextlib.redirect_stderr(io.StringIO()):
            rejected = main([
                "--archive", str(self.archive),
                "--destination", str(second),
                "--allow", f"{ALLOWED_FILE}:{'ab' * 32}",
                "--allow-dir", "bucket/",
            ])
            malformed = main(["--archive", str(self.archive), "--destination", str(second), "--allow", "not-a-pair"])
        self.assertEqual(rejected, 1)
        self.assertFalse(second.exists())
        self.assertEqual(malformed, 2)

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
