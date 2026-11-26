BEGIN;

ALTER TABLE devices
DROP CONSTRAINT IF EXISTS devices_hardware_category_check;

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
        'FOG_HEATER'
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
    id,
    'ACT-FOG-' || zone_code,
    'ACTUATOR_RELAY',
    'FOG_HEATER',
    'ACTIVE'
FROM zones
ON CONFLICT (device_code) DO NOTHING;

COMMIT;
