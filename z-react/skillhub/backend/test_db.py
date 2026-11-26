from shared.database import test_connection as current_database


def test_isolated_database_connection():
    assert current_database() == "postgres"
