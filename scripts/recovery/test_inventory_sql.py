import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parent
SQL = (ROOT / "inventory.sql").read_text(encoding="utf-8")


class InventorySqlTests(unittest.TestCase):
    def test_file_is_labelled_and_has_no_write_statements(self):
        self.assertIn("not the historical", SQL)
        folded = SQL.lower()
        for forbidden in ("insert ", "update ", "delete ", "drop ", "alter ", "create ", "truncate ", "grant ", "revoke "):
            self.assertNotIn(forbidden, folded)

    def test_counting_rules_are_explicit(self):
        self.assertIn("relkind IN ('r', 'p')", SQL)
        self.assertIn("prokind = 'f'", SQL)
        self.assertIn("pg_catalog", SQL)
        self.assertIn("information_schema", SQL)
        self.assertIn("pg_toast", SQL)
        self.assertIn("pg_temp_%", SQL)
        self.assertIn("pg_toast_temp_%", SQL)
        self.assertIn("9 schemas", SQL)
        self.assertIn("116 functions", SQL)
        self.assertIn("189 indexes", SQL)
        self.assertIn("does not reproduce", SQL)


if __name__ == "__main__":
    unittest.main()
