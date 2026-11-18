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
        self.assertNotIn("pg_dump", backup)
        self.assertNotIn("upload-artifact", backup)
        guard = texts["recovery-restore-guard.yml"]
        self.assertNotIn("pg_restore", guard)
        self.assertIn("restore_target.py", guard)


if __name__ == "__main__":
    unittest.main()
