
import pytest

import sensor_simulator as simulator


def test_generate_readings_returns_three_zones():
    simulator.set_scenario("normal")
    readings = simulator.generate_readings()

    assert len(readings) == 3
    assert {reading["device_code"] for reading in readings} == {
        "SNS-ZONE-01",
        "SNS-ZONE-02",
        "SNS-ZONE-03"
    }


def test_readings_contain_all_required_metrics():
    simulator.set_scenario("normal")
    readings = simulator.generate_readings()

    required_fields = {
        "device_code",
        "temperature",
        "air_humidity",
        "soil_humidity",
        "light_lux",
        "ec_value",
        "ph_value",
        "water_tank_level"
    }

    for reading in readings:
        assert required_fields.issubset(reading.keys())


def test_sensor_values_stay_within_limits():
    simulator.set_scenario("normal")
    readings = simulator.generate_readings()

    for reading in readings:
        for sensor, (minimum, maximum) in simulator.SENSOR_LIMITS.items():
            assert minimum <= reading[sensor] <= maximum

        assert 0.0 <= reading["water_tank_level"] <= 100.0


@pytest.mark.parametrize(
    ("scenario", "sensor", "expected"),
    [
        ("high-temperature", "temperature", 32.0),
        ("high-humidity", "air_humidity", 85.0),
        ("low-humidity", "air_humidity", 40.0),
        ("low-soil-moisture", "soil_humidity", 50.0)
    ]
)
def test_sensor_scenarios(scenario, sensor, expected):
    simulator.set_scenario(scenario)
    readings = simulator.generate_readings()

    zone_one = next(
        reading for reading in readings
        if reading["device_code"] == "SNS-ZONE-01"
    )

    assert abs(zone_one[sensor] - expected) <= simulator.SENSOR_VARIATIONS[sensor]


def test_low_water_tank_scenario():
    simulator.set_scenario("low-water-tank")
    readings = simulator.generate_readings()

    assert all(reading["water_tank_level"] == 10.0 for reading in readings)


def test_soil_moisture_recovered_scenario():
    simulator.set_scenario("soil-moisture-recovered")
    readings = simulator.generate_readings()

    zone_one = next(
        reading for reading in readings
        if reading["device_code"] == "SNS-ZONE-01"
    )

    assert zone_one["soil_humidity"] == 80.0


def test_invalid_scenario_raises_error():
    with pytest.raises(ValueError):
        simulator.set_scenario("invalid-scenario")


def test_normal_scenario_resets_sensor_states():
    simulator.set_scenario("high-temperature")
    simulator.set_scenario("normal")
    readings = simulator.generate_readings()

    zone_one = next(
        reading for reading in readings
        if reading["device_code"] == "SNS-ZONE-01"
    )

    assert abs(zone_one["temperature"] - 23.5) <= simulator.SENSOR_VARIATIONS["temperature"]
