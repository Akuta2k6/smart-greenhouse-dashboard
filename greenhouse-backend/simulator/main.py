
import argparse
import time
from datetime import datetime, timezone

import psycopg

from config import DATABASE_CONFIG, SIMULATION_INTERVAL
from sensor_simulator import generate_readings, set_scenario, SCENARIOS

DEVICE_CODES = [
    "SNS-ZONE-01",
    "SNS-ZONE-02",
    "SNS-ZONE-03"
]

INSERT_TELEMETRY_SQL = """
    INSERT INTO telemetry (
        device_id,
        recorded_at,
        temperature,
        air_humidity,
        soil_humidity,
        light_lux,
        ec_value,
        ph_value,
        water_tank_level
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

def load_sensor_devices(connection):
    rows = connection.execute(
        """
        SELECT id, device_code
        FROM devices
        WHERE device_code = ANY(%s)
          AND device_type = 'SENSOR_NODE'
          AND status = 'ACTIVE'
        """,
        (DEVICE_CODES,)
    ).fetchall()

    devices = {
        row["device_code"]: row["id"]
        for row in rows
    }

    missing_devices = set(DEVICE_CODES) - set(devices)

    if missing_devices:
        raise RuntimeError(
            f"Missing active sensor devices: {sorted(missing_devices)}"
        )

    return devices

def save_telemetry(connection, devices):
    readings = generate_readings()
    recorded_at = datetime.now(timezone.utc)

    records = [
        (
            devices[reading["device_code"]],
            recorded_at,
            reading["temperature"],
            reading["air_humidity"],
            reading["soil_humidity"],
            reading["light_lux"],
            reading["ec_value"],
            reading["ph_value"],
            reading["water_tank_level"]
        )
        for reading in readings
    ]

    with connection.transaction():
        with connection.cursor() as cursor:
            cursor.executemany(INSERT_TELEMETRY_SQL, records)

    return len(records)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--scenario",
        choices=list(SCENARIOS.keys()),
        default="normal"
    )
    args = parser.parse_args()

    set_scenario(args.scenario)

    connection = psycopg.connect(
        **DATABASE_CONFIG,
        row_factory=psycopg.rows.dict_row,
        autocommit=True
    )

    try:
        devices = load_sensor_devices(connection)

        print("Sensor Simulator started")
        print(f"Scenario: {args.scenario}")
        print(f"Connected devices: {len(devices)}")
        print(f"Simulation interval: {SIMULATION_INTERVAL} seconds")

        cycle = 0

        while True:
            cycle += 1

            try:
                inserted = save_telemetry(connection, devices)

                print(
                    f"[{datetime.now().astimezone().strftime('%H:%M:%S')}] "
                    f"Cycle {cycle}: inserted {inserted} telemetry records"
                )

            except Exception as error:
                print(f"Cycle {cycle} failed: {type(error).__name__}: {error}")

                if connection.closed:
                    connection = psycopg.connect(
                        **DATABASE_CONFIG,
                        row_factory=psycopg.rows.dict_row,
                        autocommit=True
                    )
                    devices = load_sensor_devices(connection)

            time.sleep(SIMULATION_INTERVAL)

    except KeyboardInterrupt:
        print("\nSensor Simulator stopped")

    finally:
        connection.close()

if __name__ == "__main__":
    main()
