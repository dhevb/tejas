import base64
import io
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from subprocess import CompletedProcess
from unittest.mock import patch

from backup_pipeline import (
    PipelineRejected,
    execute_backup,
    main,
    backup_name,
    compare_checksums,
    dump_argv,
    identity_accepted,
    parse_identity,
    source_is_project,
)
from retention import RetentionRejected, delete_backup, manifest_line, refuse_existing, validate_directory


def tempfile_work():
    return tempfile.TemporaryDirectory()


def _env(config: str, destination: str = "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS") -> dict[str, str]:
    return {
        "PATH": "/usr/bin:/bin",
        "SUPABASE_BACKUP_DB_URL": "postgresql://postgres.zapccpipwxduzlnvjdmy:fixture-password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
        "TEJAS_BACKUP_ENCRYPTION_PASSPHRASE": "fixture-passphrase",
        "TEJAS_BACKUP_DESTINATION": destination,
        "TEJAS_RCLONE_CONFIG_B64": config,
    }


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

    def test_remote_failures_stop_before_a_database_command(self):
        token = "fixture-token-value"
        other = base64.b64encode(f"[otherdrive]\ntype = drive\ntoken = {token}\n".encode()).decode()
        calls = []

        def run(argv, env):
            calls.append(os.path.basename(argv[0]))
            raise AssertionError("remote command")

        with tempfile_work() as work:
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                code = execute_backup(_env(other), run, "/bin/true", work, "20261118T085500Z")
        self.assertEqual(code, 2)
        self.assertEqual(calls, [])
        self.assertNotIn(token, stderr.getvalue())

        listed = []

        def list_other(argv, env):
            listed.append(argv[1])
            self.assertNotIn("SUPABASE_BACKUP_DB_URL", env)
            self.assertNotIn(token, " ".join(argv))
            return CompletedProcess(argv, 0, "otherdrive:\n", "")

        config = base64.b64encode(f"[tejasdrive]\ntype = drive\ntoken = {token}\n".encode()).decode()
        with tempfile_work() as work:
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                code = execute_backup(_env(config), list_other, "/bin/true", work, "20261118T085500Z")
        self.assertEqual(code, 2)
        self.assertEqual(listed, ["listremotes"])
        self.assertNotIn(token, stderr.getvalue())

        rejected_calls = []

        def reject_run(argv, env):
            rejected_calls.append(argv[1])
            raise AssertionError("destination command")

        with tempfile_work() as work:
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                code = execute_backup(
                    _env(config, "tejasdrive:TEJAS_PRODUCTION_SECURE_BACKUPS/DATABASE_BACKUPS/fixed.dump.seal"),
                    reject_run,
                    "/bin/true",
                    work,
                    "20261118T085500Z",
                )
        self.assertEqual(code, 2)
        self.assertEqual(rejected_calls, [])
        self.assertNotIn(token, stderr.getvalue())

        unreachable = []

        def unreachable_run(argv, env):
            command = argv[1]
            unreachable.append(command)
            if command == "listremotes":
                return CompletedProcess(argv, 0, "tejasdrive:\n", "")
            if command == "lsf":
                return CompletedProcess(argv, 3, "", token)
            raise AssertionError(command)

        with tempfile_work() as work:
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                code = execute_backup(_env(config), unreachable_run, "/bin/true", work, "20261118T085500Z")
        self.assertEqual(code, 2)
        self.assertEqual(unreachable, ["listremotes", "lsf"])
        self.assertNotIn("psql", unreachable)
        self.assertNotIn(token, stderr.getvalue())

    def test_backup_reaches_the_database_only_after_the_remote_answers(self):
        token = "fixture-token-value"
        config = base64.b64encode(f"[tejasdrive]\ntype = drive\ntoken = {token}\n".encode()).decode()
        calls = []
        stored = {}

        def run(argv, env):
            command = argv[1] if os.path.basename(argv[0]) == "true" else os.path.basename(argv[0])
            calls.append(command)
            self.assertNotIn("SUPABASE_BACKUP_DB_URL", env)
            self.assertNotIn("TEJAS_RCLONE_CONFIG_B64", env)
            self.assertNotIn(token, " ".join(argv))
            self.assertNotIn("fixture-password", " ".join(argv))
            if command == "listremotes":
                return CompletedProcess(argv, 0, "tejasdrive:\n", "")
            if command == "lsf":
                return CompletedProcess(argv, 0, "", "")
            if command == "psql":
                text = "transaction_read_only|on\ncurrent_database|postgres\nserver_version|17.11\nssl|on\ninet_server_addr|2406:da14:311:1501::1/128\n"
                return CompletedProcess(argv, 0, text, "")
            if command == "pg_dump":
                output = argv[argv.index("-f") + 1]
                with open(output, "wb") as handle:
                    handle.write(b"custom-dump-fixture")
                return CompletedProcess(argv, 0, "", "")
            if command == "copyto":
                source, dest = argv[2], argv[3]
                if source not in stored:
                    with open(source, "rb") as handle:
                        stored[dest] = handle.read()
                else:
                    with open(dest, "wb") as handle:
                        handle.write(stored[source])
                return CompletedProcess(argv, 0, "", "")
            raise AssertionError(command)

        with tempfile_work() as work:
            stdout = io.StringIO()
            stderr = io.StringIO()
            with redirect_stdout(stdout), redirect_stderr(stderr):
                code = execute_backup(_env(config), run, "/bin/true", work, "20261118T085500Z")
        self.assertEqual(code, 0, stderr.getvalue())
        self.assertLess(calls.index("listremotes"), calls.index("lsf"))
        self.assertLess(calls.index("lsf"), calls.index("psql"))
        self.assertLess(calls.index("psql"), calls.index("pg_dump"))
        self.assertLess(calls.index("pg_dump"), calls.index("copyto"))
        self.assertEqual(calls.count("copyto"), 2)
        self.assertIn("remote_match true", stdout.getvalue())
        self.assertNotIn(token, stdout.getvalue() + stderr.getvalue())
        self.assertNotIn("fixture-password", stdout.getvalue() + stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
