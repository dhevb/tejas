import base64
import os
import stat
import tempfile
import unittest

from rclone_remote import RCLONE_SHA256, RCLONE_VERSION, decode_config, scrubbed_env, write_config


TOKEN = "fixture-token-value"


class RcloneRemoteTests(unittest.TestCase):
    def test_config_is_private_and_a_different_remote_is_rejected(self):
        payload = decode_config(base64.b64encode(f"[tejasdrive]\ntype = drive\ntoken = {TOKEN}\n".encode()).decode())
        with tempfile.TemporaryDirectory() as directory:
            path = write_config(payload, directory)
            self.assertEqual(stat.S_IMODE(os.stat(path).st_mode), 0o600)
            self.assertNotIn(TOKEN, path)
        with self.assertRaises(Exception) as caught:
            decode_config(base64.b64encode(f"[otherdrive]\ntype = drive\ntoken = {TOKEN}\n".encode()).decode())
        self.assertIn("tejasdrive is not configured", str(caught.exception))
        self.assertNotIn(TOKEN, str(caught.exception))
        with self.assertRaises(Exception) as rejected:
            decode_config("not base64")
        self.assertNotIn(TOKEN, str(rejected.exception))

    def test_child_environment_drops_secret_material(self):
        env = scrubbed_env(
            {
                "PATH": "/usr/bin",
                "SUPABASE_BACKUP_DB_URL": "postgresql://example",
                "TEJAS_RCLONE_CONFIG_B64": base64.b64encode(TOKEN.encode()).decode(),
                "TEJAS_BACKUP_ENCRYPTION_PASSPHRASE": "fixture-passphrase",
            },
            "/tmp/rclone.conf",
        )
        self.assertEqual(env["RCLONE_CONFIG"], "/tmp/rclone.conf")
        self.assertNotIn("SUPABASE_BACKUP_DB_URL", env)
        self.assertNotIn("TEJAS_RCLONE_CONFIG_B64", env)
        self.assertNotIn("TEJAS_BACKUP_ENCRYPTION_PASSPHRASE", env)
        self.assertNotIn(TOKEN, " ".join(env.values()))
        self.assertEqual(RCLONE_VERSION, "v1.76.0")
        self.assertEqual(len(RCLONE_SHA256), 64)


if __name__ == "__main__":
    unittest.main()
