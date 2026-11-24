
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(ENV_FILE)

DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "smart_greenhouse_db"),
    "user": os.getenv("DB_USER", "greenhouse_app"),
    "password": os.getenv("DB_PASSWORD"),
}

if not DATABASE_CONFIG["password"]:
    raise RuntimeError("DB_PASSWORD is missing in greenhouse-backend/.env")

SIMULATION_INTERVAL = 5
