import unittest

from seal_backup import ITERATIONS, SealRejected, open_sealed, seal


class SealBackupTests(unittest.TestCase):
    def test_gcm_round_trip_and_rejected_passphrase(self):
        blob = seal(b"future-generation", b"fixture-passphrase", iterations=1000)
        self.assertTrue(blob.startswith(b"TEJAS1\n"))
        self.assertEqual(open_sealed(blob, b"fixture-passphrase", iterations=1000), b"future-generation")
        with self.assertRaises(SealRejected):
            open_sealed(blob, b"other-passphrase", iterations=1000)
        with self.assertRaises(SealRejected):
            open_sealed(b"not-sealed", b"fixture-passphrase", iterations=1000)

    def test_production_iteration_count_is_explicit(self):
        self.assertGreaterEqual(ITERATIONS, 600_000)


if __name__ == "__main__":
    unittest.main()
