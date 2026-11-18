import unittest

from restore_target import RestoreRejected, assert_isolated


class RestoreTargetTests(unittest.TestCase):
    def test_loopback_and_socket_targets_are_accepted(self):
        assert_isolated("127.0.0.1", "tejas_isolated_20261118")
        assert_isolated("::1", "tejas_isolated_20261118")
        assert_isolated("/var/run/postgresql", "tejas_rehearsal")

    def test_production_and_postgres_are_rejected(self):
        for host, database in (
            ("db.zapccpipwxduzlnvjdmy.supabase.co", "tejas_isolated_20261118"),
            ("127.0.0.1", "postgres"),
            ("127.0.0.1", ""),
            ("127.0.0.2", "tejas_isolated_20261118"),
            ("/var/run/postgresql", "pg_catalog"),
        ):
            with self.assertRaises(RestoreRejected):
                assert_isolated(host, database)


if __name__ == "__main__":
    unittest.main()
