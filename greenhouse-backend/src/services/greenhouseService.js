
const { randomUUID } = require('node:crypto');
const pool = require('../config/db');
const systemState = require('../data/systemState');
const { validateActuatorCommand } = require('../rules/actuatorRules');

const getLatestTelemetry = async (zoneId) => {
  const query = `
    SELECT
      z.zone_code,
      z.name AS zone_name,
      z.status,
      t.recorded_at,
      t.temperature,
      t.air_humidity,
      t.soil_humidity,
      t.light_lux,
      t.ec_value,
      t.ph_value,
      t.water_tank_level
    FROM zones z
    JOIN devices d
      ON d.zone_id = z.id
      AND d.device_type = 'SENSOR_NODE'
    JOIN LATERAL (
      SELECT *
      FROM telemetry
      WHERE device_id = d.id
      ORDER BY recorded_at DESC
      LIMIT 1
    ) t ON TRUE
    WHERE z.zone_code = $1
    ORDER BY t.recorded_at DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [zoneId]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const toNumber = (value) => value === null ? null : Number(value);

  return {
    zoneId: row.zone_code,
    zoneName: row.zone_name,
    status: row.status,
    recordedAt: row.recorded_at,
    metrics: {
      temperature: toNumber(row.temperature),
      airHumidity: toNumber(row.air_humidity),
      soilHumidity: toNumber(row.soil_humidity),
      lightLux: toNumber(row.light_lux),
      ecValue: toNumber(row.ec_value),
      phValue: toNumber(row.ph_value),
      waterTankLevel: toNumber(row.water_tank_level)
    }
  };
};

const controlActuator = async (payload) => {
  const validation = validateActuatorCommand(systemState, payload);

  if (!validation.valid) {
    return {
      success: false,
      status: validation.status,
      errorCode: validation.errorCode,
      message: validation.message
    };
  }

  const { zoneId, actuatorType, action } = payload;

  const hardwareCategoryMap = {
    IRRIGATION_PUMP: 'PUMP',
    VENTILATION_FAN: 'FAN',
    SHADE_NET: 'SHADE_NET'
  };

  const hardwareCategory = hardwareCategoryMap[actuatorType];

  const durationSeconds =
    actuatorType === 'IRRIGATION_PUMP' && action === 'TURN_ON'
      ? 120
      : null;

  const client = await pool.connect();
  const commandId = `CMD-${randomUUID()}`;

  try {
    await client.query('BEGIN');

    const deviceResult = await client.query(
      `
        SELECT d.id
        FROM devices d
        JOIN zones z ON z.id = d.zone_id
        WHERE z.zone_code = $1
          AND d.hardware_category = $2
          AND d.device_type = 'ACTUATOR_RELAY'
          AND d.status = 'ACTIVE'
        LIMIT 1
      `,
      [zoneId, hardwareCategory]
    );

    if (deviceResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return {
        success: false,
        status: 404,
        errorCode: 'ERR_ACTUATOR_DEVICE_NOT_FOUND',
        message: `Không tìm thấy thiết bị ${actuatorType} đang hoạt động tại khu vực ${zoneId}.`
      };
    }

    await client.query(
      `
        INSERT INTO actuator_commands (
          device_id,
          command_id,
          actuator_type,
          action,
          duration_seconds,
          mode,
          execution_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        deviceResult.rows[0].id,
        commandId,
        actuatorType,
        action,
        durationSeconds,
        'MANUAL_OVERRIDE',
        'EXECUTING'
      ]
    );

    await client.query('COMMIT');

    const zone = systemState.zones[zoneId];

    const actuatorStatus =
      actuatorType === 'SHADE_NET'
        ? action === 'TURN_ON' ? 'OPEN' : 'CLOSED'
        : action === 'TURN_ON' ? 'ON' : 'OFF';

    zone.actuatorsState[actuatorType] = actuatorStatus;

    return {
      success: true,
      status: 200,
      message: `Lệnh điều khiển ${actuatorType} thành công (${action}).`,
      data: {
        commandId,
        zoneId,
        actuatorType,
        action,
        actuatorStatus,
        status: 'EXECUTING',
        executedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getLatestTelemetry,
  controlActuator
};
