
from config import DATABASE_CONFIG, ENV_FILE, SIMULATION_INTERVAL


def test_environment_file_exists():
    assert ENV_FILE.exists()


def test_database_config_is_valid():
    assert DATABASE_CONFIG["host"]
    assert DATABASE_CONFIG["port"] > 0
    assert DATABASE_CONFIG["dbname"]
    assert DATABASE_CONFIG["user"]
    assert DATABASE_CONFIG["password"]


def test_simulation_interval():
    assert SIMULATION_INTERVAL == 5
    assert SIMULATION_INTERVAL > 0
