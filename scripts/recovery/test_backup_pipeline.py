import os
import unittest
from unittest.mock import patch

from backup_pipeline import (
    PipelineRejected,
    main,
    backup_name,
    compare_checksums,
    dump_argv,
    identity_accepted,
    parse_identity,
    source_is_project,
)
from retention import RetentionRejected, delete_backup, manifest_line, refuse_existing, validate_directory


class BackupPipelineTests(unittest.TestCase):
    def test_source_and_read_only_identity_are_required(self):
        source_is_project("aws-0-ap-northeast-1.pooler.supabase.com", "postgres.zapccpipwxduzlnvjdmy")
        with self.assertRaises(PipelineRejected):
            source_is_project("example.com", "postgres")
        rows = {
            "transaction_read_only": "on",
            "current_database": "postgres",
            "server_version": "17.11",
            "ssl": "on",
            "inet_server_addr": "2406:da14:311:1501::1/128",
        }
        identity_accepted(rows)
        for broken in (
            {"transaction_read_only": "off"},
            {"transaction_read_only": "on", "current_database": "template1", "server_version": "17.11", "ssl": "on", "inet_server_addr": "2406:da14::1/128"},
            {"transaction_read_only": "on", "current_database": "postgres", "server_version": "16.0", "ssl": "on", "inet_server_addr": "2406:da14::1/128"},
            {"transaction_read_only": "on", "current_database": "postgres", "server_version": "17.11", "ssl": "off", "inet_server_addr": "2406:da14::1/128"},
            {"transaction_read_only": "on", "current_database": "postgres", "server_version": "17.11", "ssl": "on", "inet_server_addr": "127.0.0.1"},
        ):
            with self.assertRaises(PipelineRejected):
                identity_accepted(broken)

    def test_dump_command_is_custom_format_without_a_password_argument(self):
        argv = dump_argv("db.zapccpipwxduzlnvjdmy.supabase.co", 5432, "postgres.zapccpipwxduzlnvjdmy", "/tmp/plain.dump")
        self.assertIn("--format=custom", argv)
        self.assertNotIn("--clean", argv)
        self.assertNotIn("--no-owner", argv)
        self.assertNotIn("--no-acl", argv)
        self.assertNotIn("secret-value", argv)
        self.assertEqual(parse_identity("transaction_read_only|on\nssl|on\n"), {"transaction_read_only": "on", "ssl": "on"})

    def test_unique_name_existing_object_and_checksum(self):
        name = backup_name("20261118T084200Z")
        self.assertTrue(name.endswith(".dump.seal"))
        refuse_existing("", name)
        with self.assertRaises(RetentionRejected):
            refuse_existing(name + "\n", name)
        compare_checksums("a" * 64, "a" * 64)
        with self.assertRaises(PipelineRejected):
            compare_checksums("a" * 64, "b" * 64)

    def test_directory_manifest_and_deletion_guard(self):
        self.assertTrue(validate_directory("tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS").endswith("/"))
        with self.assertRaises(Exception):
            validate_directory("tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/tejas-zapccpipwxduzlnvjdmy-20261118T084200Z.dump.seal")
        line = manifest_line(backup_name("20261118T084200Z"), "ab" * 32, 12)
        self.assertIn("ab" * 32, line)
        with self.assertRaises(Exception):
            delete_backup(backup_name("20261118T084200Z"))

    def test_command_stops_before_a_connection_when_a_secret_is_absent(self):
        self.assertEqual(main(["now"]), 2)
        with patch.dict(os.environ, {"PATH": os.environ.get("PATH", "")}, clear=True):
            self.assertEqual(main([]), 2)


if __name__ == "__main__":
    unittest.main()
