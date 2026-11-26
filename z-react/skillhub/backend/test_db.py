from shared.database import test_connection as current_database


def test_isolated_database_connection():
    assert current_database() == "postgres"


def test_upgrade_existing_users_table():
    from pathlib import Path
    from shared.database import engine

    migration = (Path(__file__).parent / "migrations/001_user_phone.sql").read_text()
    with engine.begin() as connection:
        connection.exec_driver_sql("CREATE TEMPORARY TABLE users (id INTEGER PRIMARY KEY)")
        connection.exec_driver_sql("INSERT INTO pg_temp.users VALUES (1)")
        for _ in range(2):
            connection.exec_driver_sql(migration)
        assert connection.exec_driver_sql("SELECT id, phone FROM pg_temp.users").one() == (1, None)
        connection.exec_driver_sql("DROP TABLE pg_temp.users")
