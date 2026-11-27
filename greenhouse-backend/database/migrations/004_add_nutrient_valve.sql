
BEGIN;

ALTER TABLE devices
DROP CONSTRAINT devices_hardware_category_check;

ALTER TABLE devices
ADD CONSTRAINT devices_hardware_category_check
CHECK (
    hardware_category IN (
        'TEMP_HUMID',
        'SOIL_MOISTURE',
        'EC_PH',
        'PUMP',
        'FAN',
        'SHADE_NET',
        'FOG_HEATER',
        'NUTRIENT_VALVE'
    )
);

ALTER TABLE actuator_commands
DROP CONSTRAINT actuator_commands_actuator_type_check;

ALTER TABLE actuator_commands
ADD CONSTRAINT actuator_commands_actuator_type_check
CHECK (
    actuator_type IN (
        'IRRIGATION_PUMP',
        'VENTILATION_FAN',
        'SHADE_NET',
        'FOG_HEATER',
        'NUTRIENT_VALVE'
    )
);

INSERT INTO devices (
    zone_id,
    device_code,
    device_type,
    hardware_category,
    status
)
SELECT
    z.id,
    'ACT-NUTRIENT-' || RIGHT(z.zone_code, 2),
    'ACTUATOR_RELAY',
    'NUTRIENT_VALVE',
    'ACTIVE'
FROM zones z
WHERE z.zone_code IN (
    'ZONE-STRAWBERRY-01',
    'ZONE-STRAWBERRY-02',
    'ZONE-STRAWBERRY-03'
)
AND NOT EXISTS (
    SELECT 1
    FROM devices d
    WHERE d.zone_id = z.id
      AND d.hardware_category = 'NUTRIENT_VALVE'
);

COMMIT;
