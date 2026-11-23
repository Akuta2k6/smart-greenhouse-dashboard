
BEGIN;

INSERT INTO greenhouses (code, name, location, total_area_m2)
VALUES (
    'SGH-001',
    'Smart Strawberry Greenhouse',
    'Vietnam',
    500.00
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    total_area_m2 = EXCLUDED.total_area_m2;

INSERT INTO zones (
    greenhouse_id,
    zone_code,
    name,
    strawberry_variety,
    pos_x,
    pos_y,
    status
)
SELECT
    g.id,
    v.zone_code,
    v.name,
    v.strawberry_variety,
    v.pos_x,
    v.pos_y,
    v.status
FROM greenhouses g
CROSS JOIN (
    VALUES
        ('ZONE-STRAWBERRY-01', 'Khu 1 - Dâu Hana (Nhật Bản)', 'Hana', 50.00, 50.00, 'OPTIMAL'),
        ('ZONE-STRAWBERRY-02', 'Khu 2 - Dâu Tochiotome', 'Tochiotome', 200.00, 50.00, 'WARNING'),
        ('ZONE-STRAWBERRY-03', 'Khu 3 - Dâu Shizuka Premium', 'Shizuka', 350.00, 50.00, 'OPTIMAL')
) AS v(zone_code, name, strawberry_variety, pos_x, pos_y, status)
WHERE g.code = 'SGH-001'
ON CONFLICT (zone_code) DO UPDATE SET
    name = EXCLUDED.name,
    strawberry_variety = EXCLUDED.strawberry_variety,
    pos_x = EXCLUDED.pos_x,
    pos_y = EXCLUDED.pos_y,
    status = EXCLUDED.status;

INSERT INTO devices (
    zone_id,
    device_code,
    device_type,
    hardware_category,
    status
)
SELECT
    z.id,
    v.device_code,
    v.device_type,
    v.hardware_category,
    'ACTIVE'
FROM zones z
JOIN (
    VALUES
        ('ZONE-STRAWBERRY-01', 'SNS-ZONE-01', 'SENSOR_NODE', 'TEMP_HUMID'),
        ('ZONE-STRAWBERRY-01', 'ACT-PUMP-01', 'ACTUATOR_RELAY', 'PUMP'),
        ('ZONE-STRAWBERRY-01', 'ACT-FAN-01', 'ACTUATOR_RELAY', 'FAN'),
        ('ZONE-STRAWBERRY-01', 'ACT-SHADE-01', 'ACTUATOR_RELAY', 'SHADE_NET'),

        ('ZONE-STRAWBERRY-02', 'SNS-ZONE-02', 'SENSOR_NODE', 'TEMP_HUMID'),
        ('ZONE-STRAWBERRY-02', 'ACT-PUMP-02', 'ACTUATOR_RELAY', 'PUMP'),
        ('ZONE-STRAWBERRY-02', 'ACT-FAN-02', 'ACTUATOR_RELAY', 'FAN'),
        ('ZONE-STRAWBERRY-02', 'ACT-SHADE-02', 'ACTUATOR_RELAY', 'SHADE_NET'),

        ('ZONE-STRAWBERRY-03', 'SNS-ZONE-03', 'SENSOR_NODE', 'TEMP_HUMID'),
        ('ZONE-STRAWBERRY-03', 'ACT-PUMP-03', 'ACTUATOR_RELAY', 'PUMP'),
        ('ZONE-STRAWBERRY-03', 'ACT-FAN-03', 'ACTUATOR_RELAY', 'FAN'),
        ('ZONE-STRAWBERRY-03', 'ACT-SHADE-03', 'ACTUATOR_RELAY', 'SHADE_NET')
) AS v(zone_code, device_code, device_type, hardware_category)
    ON z.zone_code = v.zone_code
ON CONFLICT (device_code) DO UPDATE SET
    zone_id = EXCLUDED.zone_id,
    device_type = EXCLUDED.device_type,
    hardware_category = EXCLUDED.hardware_category,
    status = EXCLUDED.status;

INSERT INTO thresholds (
    zone_id,
    temp_optimal_min,
    temp_optimal_max,
    temp_critical_high,
    soil_humid_min,
    soil_humid_max,
    target_ec,
    target_ph_min,
    target_ph_max
)
SELECT
    z.id,
    18.00,
    25.00,
    30.00,
    60.00,
    80.00,
    1.50,
    5.50,
    6.50
FROM zones z
WHERE z.zone_code IN (
    'ZONE-STRAWBERRY-01',
    'ZONE-STRAWBERRY-02',
    'ZONE-STRAWBERRY-03'
)
ON CONFLICT (zone_id) DO UPDATE SET
    temp_optimal_min = EXCLUDED.temp_optimal_min,
    temp_optimal_max = EXCLUDED.temp_optimal_max,
    temp_critical_high = EXCLUDED.temp_critical_high,
    soil_humid_min = EXCLUDED.soil_humid_min,
    soil_humid_max = EXCLUDED.soil_humid_max,
    target_ec = EXCLUDED.target_ec,
    target_ph_min = EXCLUDED.target_ph_min,
    target_ph_max = EXCLUDED.target_ph_max,
    updated_at = CURRENT_TIMESTAMP;

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
SELECT
    d.id,
    CURRENT_TIMESTAMP,
    v.temperature,
    v.air_humidity,
    v.soil_humidity,
    v.light_lux,
    v.ec_value,
    v.ph_value,
    12.00
FROM (
    VALUES
        ('SNS-ZONE-01', 23.50, 68.20, 64.50, 24500.00, 1.420, 6.05),
        ('SNS-ZONE-02', 29.20, 52.00, 55.00, 31000.00, 1.850, 5.40),
        ('SNS-ZONE-03', 21.80, 71.00, 78.00, 19000.00, 1.350, 6.10)
) AS v(device_code, temperature, air_humidity, soil_humidity, light_lux, ec_value, ph_value)
JOIN devices d ON d.device_code = v.device_code
WHERE NOT EXISTS (
    SELECT 1
    FROM telemetry t
    WHERE t.device_id = d.id
);

COMMIT;
