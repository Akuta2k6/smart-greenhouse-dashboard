
from sensor_simulator import generate_readings

for cycle in range(2):
    print(f"\nCycle {cycle + 1}")

    for reading in generate_readings():
        print(reading)
