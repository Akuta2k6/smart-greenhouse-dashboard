
from config import DATABASE_CONFIG, ENV_FILE, SIMULATION_INTERVAL

print("Environment file exists:", ENV_FILE.exists())
print("Database:", DATABASE_CONFIG["dbname"])
print("Database user:", DATABASE_CONFIG["user"])
print("Simulation interval:", SIMULATION_INTERVAL)
print("Password loaded:", bool(DATABASE_CONFIG["password"]))
