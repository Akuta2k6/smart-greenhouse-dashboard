
BEGIN;

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'AGRONOMIST', 'WORKER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE greenhouses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    location TEXT,
    total_area_m2 NUMERIC(10, 2) CHECK (total_area_m2 IS NULL OR total_area_m2 > 0),
    svg_map_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE zones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    greenhouse_id BIGINT NOT NULL REFERENCES greenhouses(id) ON DELETE RESTRICT,
    zone_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    strawberry_variety VARCHAR(100),
    pos_x NUMERIC(8, 2),
    pos_y NUMERIC(8, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'OPTIMAL'
        CHECK (status IN ('OPTIMAL', 'WARNING', 'CRITICAL', 'OFFLINE'))
);

CREATE TABLE devices (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    device_code VARCHAR(50) NOT NULL UNIQUE,
    mac_address VARCHAR(17) UNIQUE,
    device_type VARCHAR(30) NOT NULL
        CHECK (device_type IN ('SENSOR_NODE', 'EDGE_CONTROLLER', 'ACTUATOR_RELAY')),
    hardware_category VARCHAR(30) NOT NULL
        CHECK (hardware_category IN ('TEMP_HUMID', 'SOIL_MOISTURE', 'EC_PH', 'PUMP', 'FAN', 'SHADE_NET')),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE'
        CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'FAULTY', 'OFFLINE')),
    last_seen_at TIMESTAMPTZ
);

CREATE TABLE thresholds (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zone_id BIGINT NOT NULL UNIQUE REFERENCES zones(id) ON DELETE RESTRICT,
    temp_optimal_min NUMERIC(5, 2),
    temp_optimal_max NUMERIC(5, 2),
    temp_critical_high NUMERIC(5, 2),
    soil_humid_min NUMERIC(5, 2),
    soil_humid_max NUMERIC(5, 2),
    target_ec NUMERIC(6, 3),
    target_ph_min NUMERIC(4, 2),
    target_ph_max NUMERIC(4, 2),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (temp_optimal_min IS NULL OR temp_optimal_max IS NULL OR temp_optimal_min <= temp_optimal_max),
    CHECK (soil_humid_min IS NULL OR soil_humid_max IS NULL OR soil_humid_min <= soil_humid_max),
    CHECK (target_ph_min IS NULL OR target_ph_max IS NULL OR target_ph_min <= target_ph_max),
    CHECK (temp_critical_high IS NULL OR temp_optimal_max IS NULL OR temp_critical_high > temp_optimal_max),
    CHECK (soil_humid_min IS NULL OR soil_humid_min BETWEEN 0 AND 100),
    CHECK (soil_humid_max IS NULL OR soil_humid_max BETWEEN 0 AND 100)
);

CREATE TABLE telemetry (
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMPTZ NOT NULL,
    temperature NUMERIC(5, 2),
    air_humidity NUMERIC(5, 2),
    soil_humidity NUMERIC(5, 2),
    light_lux NUMERIC(12, 2),
    ec_value NUMERIC(7, 3),
    ph_value NUMERIC(4, 2),
    water_tank_level NUMERIC(5, 2),
    PRIMARY KEY (device_id, recorded_at),
    CHECK (air_humidity IS NULL OR air_humidity BETWEEN 0 AND 100),
    CHECK (soil_humidity IS NULL OR soil_humidity BETWEEN 0 AND 100),
    CHECK (light_lux IS NULL OR light_lux >= 0),
    CHECK (ec_value IS NULL OR ec_value >= 0),
    CHECK (ph_value IS NULL OR ph_value BETWEEN 0 AND 14),
    CHECK (water_tank_level IS NULL OR water_tank_level BETWEEN 0 AND 100)
);

CREATE TABLE actuator_commands (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    command_id VARCHAR(100) NOT NULL UNIQUE,
    actuator_type VARCHAR(30) NOT NULL
        CHECK (actuator_type IN ('IRRIGATION_PUMP', 'VENTILATION_FAN', 'SHADE_NET', 'FOG_HEATER')),
    action VARCHAR(10) NOT NULL CHECK (action IN ('TURN_ON', 'TURN_OFF')),
    duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    mode VARCHAR(20) NOT NULL DEFAULT 'MANUAL_OVERRIDE'
        CHECK (mode IN ('AUTO', 'MANUAL_OVERRIDE')),
    execution_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (execution_status IN ('PENDING', 'EXECUTING', 'COMPLETED', 'FAILED')),
    triggered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    device_id BIGINT REFERENCES devices(id) ON DELETE SET NULL,
    reported_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crop_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    growth_stage VARCHAR(20) NOT NULL
        CHECK (growth_stage IN ('PLANTING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'HARVESTING')),
    notes TEXT,
    harvest_yield_kg NUMERIC(10, 2) CHECK (harvest_yield_kg IS NULL OR harvest_yield_kg >= 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_greenhouse_id ON zones(greenhouse_id);
CREATE INDEX idx_devices_zone_id ON devices(zone_id);
CREATE INDEX idx_telemetry_recorded_at ON telemetry(recorded_at DESC);
CREATE INDEX idx_actuator_commands_device_created ON actuator_commands(device_id, created_at DESC);
CREATE INDEX idx_incidents_zone_status ON incidents(zone_id, status);
CREATE INDEX idx_crop_logs_zone_logged ON crop_logs(zone_id, logged_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

COMMIT;
