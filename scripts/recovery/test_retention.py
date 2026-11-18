import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from retention import (
    NAME_PATTERN,
    RetentionRejected,
    age_status,
    missing_secrets,
    plan_rotation,
    remote_ready,
    validate_destination,
    verify_local,
)


class RetentionTests(unittest.TestCase):
    def test_local_checksum_matches_and_mismatch_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "backup.dump.enc"
            path.write_bytes(b"ciphertext-fixture")
            digest = __import__("hashlib").sha256(b"ciphertext-fixture").hexdigest()
            verify_local(str(path), digest)
            with self.assertRaises(RetentionRejected):
                verify_local(str(path), "0" * 64)

    def test_only_the_approved_private_folder_is_accepted(self):
        accepted = "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261118T024405Z.dump.enc"
        self.assertTrue(NAME_PATTERN.fullmatch(accepted.rsplit("/", 1)[1]))
        validate_destination(accepted)
        for rejected in (
            "https://example.com/backup.dump.enc",
            "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/../DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261118T024405Z.dump.enc",
            "other:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261118T024405Z.dump.enc",
            accepted + "/extra",
        ):
            with self.assertRaises(RetentionRejected):
                validate_destination(rejected)

    def test_missing_remote_and_missing_secret_names_fail_closed(self):
        with self.assertRaises(RetentionRejected):
            remote_ready([])
        remote_ready(["tejasdrive:"])
        self.assertEqual(
            missing_secrets({}),
            [
                "SUPABASE_BACKUP_DB_URL",
                "TEJAS_BACKUP_ENCRYPTION_PASSPHRASE",
                "TEJAS_BACKUP_DESTINATION",
            ],
        )

    def test_rotation_plan_deletes_nothing(self):
        names = [
            "tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc",
            "tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc",
            "tejas-zapccpipwxduzlnvjdmy-20261118T024405Z.dump.enc",
        ]
        kept, dropped = plan_rotation(names, 2)
        self.assertEqual(kept[-1], names[-1])
        self.assertEqual(len(dropped), 1)
        with self.assertRaises(RetentionRejected):
            plan_rotation(["notes.txt"], 1)

    def test_preflight_process_fails_closed_without_printing_a_url(self):
        env = {"PATH": os.environ.get("PATH", "")}
        completed = subprocess.run(
            [sys.executable, "backup_preflight.py"],
            cwd=Path(__file__).resolve().parent,
            env=env,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(completed.returncode, 2)
        self.assertIn("required secret is absent", completed.stderr)
        self.assertNotIn("postgresql://", completed.stderr)
        self.assertNotIn("postgresql://", completed.stdout)

    def test_backup_age_uses_timezones(self):
        created = datetime(2026, 11, 18, 2, 44, 5, tzinfo=timezone.utc)
        now = datetime(2026, 11, 18, 3, 14, 5, tzinfo=timezone.utc)
        self.assertEqual(age_status(created, now, 48), "PASS")
        self.assertEqual(age_status(created, now, 0.1), "STALE")


if __name__ == "__main__":
    unittest.main()
