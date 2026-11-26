const { randomUUID } = require('node:crypto');
const pool = require('../config/db');
const systemState = require('../data/systemState');
const {
  isPumpRuntimeExpired,
  isPumpCooldownActive
} = require('../rules/pumpTiming');

const HARDWARE_CATEGORY_MAP = {
  IRRIGATION_PUMP: 'PUMP',
  VENTILATION_FAN: 'FAN',
  SHADE_NET: 'SHADE_NET',
  FOG_HEATER: 'FOG_HEATER'
};

const getActuatorStatus = (actuatorType, action) => {
  if (actuatorType === 'SHADE_NET') {
    return action === 'TURN_ON' ? 'OPEN' : 'CLOSED';
  }

  return action === 'TURN_ON' ? 'ON' : 'OFF';
};

const getManualOverrideStatus = async (zoneId, actuatorType, client = pool) => {
  const hardwareCategory = HARDWARE_CATEGORY_MAP[actuatorType];

  const { rows } = await client.query(
    `
      SELECT
        latest.mode,
        latest.created_at,
        (
          latest.mode = 'MANUAL_OVERRIDE'
          AND latest.created_at > NOW() - INTERVAL '15 minutes'
        ) AS is_active
      FROM devices d
      JOIN zones z ON z.id = d.zone_id
      LEFT JOIN LATERAL (
        SELECT mode, created_at
        FROM actuator_commands
        WHERE device_id = d.id
          AND execution_status = 'COMPLETED'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) latest ON TRUE
      WHERE z.zone_code = $1
        AND d.hardware_category = $2
        AND d.device_type = 'ACTUATOR_RELAY'
        AND d.status = 'ACTIVE'
      LIMIT 1
    `,
    [zoneId, hardwareCategory]
  );

  if (rows.length === 0) {
    throw new Error(`Không tìm thấy thiết bị ${actuatorType} tại ${zoneId}.`);
  }

  return rows[0].is_active === true;
};


const getPumpTimingStatus = async (zoneId, client = pool) => {
  const { rows } = await client.query(
    `
      SELECT
        latest.action,
        latest.created_at,
        latest.duration_seconds
      FROM devices d
      JOIN zones z ON z.id = d.zone_id
      LEFT JOIN LATERAL (
        SELECT action, created_at, duration_seconds
        FROM actuator_commands
        WHERE device_id = d.id
          AND execution_status = 'COMPLETED'
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) latest ON TRUE
      WHERE z.zone_code = $1
        AND d.hardware_category = 'PUMP'
        AND d.device_type = 'ACTUATOR_RELAY'
        AND d.status = 'ACTIVE'
      LIMIT 1
    `,
    [zoneId]
  );

  if (rows.length === 0) {
    throw new Error(`Không tìm thấy máy bơm tại ${zoneId}.`);
  }

  const latestCommand = rows[0];
  const isRunning = latestCommand.action === 'TURN_ON';
  const isStopped = latestCommand.action === 'TURN_OFF';

  return {
    isRunning,
    startedAt: isRunning ? latestCommand.created_at : null,
    runtimeExpired: isRunning && isPumpRuntimeExpired(
      latestCommand.created_at
    ),
    stoppedAt: isStopped ? latestCommand.created_at : null,
    cooldownActive: isStopped && isPumpCooldownActive(
      latestCommand.created_at
    ),
    durationSeconds: latestCommand.duration_seconds === null
      ? null
      : Number(latestCommand.duration_seconds)
  };
};

const executeActuatorCommand = async ({
  zoneId,
  actuatorType,
  action,
  mode = 'AUTO',
  reason
}) => {
  const hardwareCategory = HARDWARE_CATEGORY_MAP[actuatorType];

  if (!hardwareCategory) {
    throw new Error(`Thiết bị không được hỗ trợ: ${actuatorType}`);
  }

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
        FOR UPDATE OF d
      `,
      [zoneId, hardwareCategory]
    );

    if (deviceResult.rows.length === 0) {
      throw new Error(`Không tìm thấy thiết bị ${actuatorType} tại ${zoneId}.`);
    }

    const durationSeconds =
      actuatorType === 'IRRIGATION_PUMP' && action === 'TURN_ON'
        ? 120
        : null;

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
        VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')
      `,
      [
        deviceResult.rows[0].id,
        commandId,
        actuatorType,
        action,
        durationSeconds,
        mode
      ]
    );

    await client.query('COMMIT');

    const status = getActuatorStatus(actuatorType, action);
    systemState.zones[zoneId].actuatorsState[actuatorType] = status;

    return {
      commandId,
      zoneId,
      actuatorType,
      action,
      mode,
      status,
      reason
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getManualOverrideStatus,
  getPumpTimingStatus,
  executeActuatorCommand
};
