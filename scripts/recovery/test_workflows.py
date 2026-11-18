import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"


class WorkflowTests(unittest.TestCase):
    def test_recovery_workflows_do_not_schedule_or_embed_secrets(self):
        texts = {path.name: path.read_text(encoding="utf-8") for path in WORKFLOWS.glob("recovery-*.yml")}
        self.assertEqual(set(texts), {"recovery-backup.yml", "recovery-restore-guard.yml"})
        for name, text in texts.items():
            self.assertNotIn("schedule:", text, name)
            self.assertNotIn("postgresql://", text, name)
            self.assertNotIn("eyJ", text, name)
            self.assertIn("contents: read", text, name)
            self.assertIn("workflow_dispatch:", text, name)
        backup = texts["recovery-backup.yml"]
        self.assertIn("github.event.inputs.action == 'backup'", backup)
        self.assertIn("secrets.SUPABASE_BACKUP_DB_URL", backup)
        self.assertIn("secrets.TEJAS_BACKUP_ENCRYPTION_PASSPHRASE", backup)
        self.assertIn("secrets.TEJAS_BACKUP_DESTINATION", backup)
        self.assertIn("secrets.TEJAS_RCLONE_CONFIG_B64", backup)
        self.assertNotIn("pg_dump", backup)
        self.assertNotIn("upload-artifact", backup)
        self.assertNotIn("schedule:", backup)
        validate, backup_job = backup.split("  backup:", 1)
        self.assertNotIn("python3 backup_pipeline.py", validate)
        self.assertNotIn("downloads.rclone.org", validate)
        self.assertLess(backup_job.index("backup_preflight.py secrets"), backup_job.index("sha256sum -c"))
        self.assertLess(backup_job.index("sha256sum -c"), backup_job.index("backup_preflight.py remote"))
        self.assertLess(backup_job.index("backup_preflight.py remote"), backup_job.index("postgresql-client-17"))
        self.assertLess(backup_job.index("postgresql-client-17"), backup_job.index("python3 backup_pipeline.py"))
        from rclone_remote import RCLONE_SHA256, RCLONE_VERSION
        self.assertIn(RCLONE_VERSION, backup_job)
        self.assertIn(RCLONE_SHA256, backup_job)
        pipeline = (ROOT / "scripts" / "recovery" / "backup_pipeline.py").read_text(encoding="utf-8")
        self.assertIn("--format=custom", pipeline)
        self.assertIn("dump flags rejected", pipeline)
        self.assertIn("backup deletion is not permitted", (ROOT / "scripts" / "recovery" / "retention.py").read_text(encoding="utf-8"))
        guard = texts["recovery-restore-guard.yml"]
        self.assertNotIn("pg_restore", guard)
        self.assertIn("restore_target.py", guard)


if __name__ == "__main__":
    unittest.main()
