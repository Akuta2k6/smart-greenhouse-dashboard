
import random

SENSOR_STATES = {
    "SNS-ZONE-01": {
        "temperature": 23.5,
        "air_humidity": 68.2,
        "soil_humidity": 64.5,
        "light_lux": 24500.0,
        "ec_value": 1.42,
        "ph_value": 6.05
    },
    "SNS-ZONE-02": {
        "temperature": 23.2,
        "air_humidity": 52.0,
        "soil_humidity": 55.0,
        "light_lux": 31000.0,
        "ec_value": 1.85,
        "ph_value": 5.40
    },
    "SNS-ZONE-03": {
        "temperature": 23.8,
        "air_humidity": 71.0,
        "soil_humidity": 78.0,
        "light_lux": 19000.0,
        "ec_value": 1.35,
        "ph_value": 6.10
    }
}

WATER_TANK_LEVEL = 80.0

SENSOR_LIMITS = {
    "temperature": (10.0, 45.0),
    "air_humidity": (0.0, 100.0),
    "soil_humidity": (0.0, 100.0),
    "light_lux": (0.0, 100000.0),
    "ec_value": (0.0, 10.0),
    "ph_value": (0.0, 14.0)
}

SENSOR_VARIATIONS = {
    "temperature": 0.15,
    "air_humidity": 0.4,
    "soil_humidity": 0.2,
    "light_lux": 500.0,
    "ec_value": 0.01,
    "ph_value": 0.01
}


def update_value(value, variation, minimum, maximum, precision):
    change = random.uniform(-variation, variation)
    updated = max(minimum, min(maximum, value + change))
    return round(updated, precision)


def generate_readings():
    global WATER_TANK_LEVEL

    WATER_TANK_LEVEL = update_value(
        WATER_TANK_LEVEL,
        0.02,
        0.0,
        100.0,
        2
    )

    readings = []

    for device_code, state in SENSOR_STATES.items():
        for sensor, variation in SENSOR_VARIATIONS.items():
            minimum, maximum = SENSOR_LIMITS[sensor]
            precision = 2 if sensor != "ec_value" else 3
            state[sensor] = update_value(
                state[sensor],
                variation,
                minimum,
                maximum,
                precision
            )

        readings.append({
            "device_code": device_code,
            **state,
            "water_tank_level": WATER_TANK_LEVEL
        })

    return readings
