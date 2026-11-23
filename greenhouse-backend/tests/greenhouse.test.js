
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const pool = require('../src/config/db');
const systemState = require('../src/data/systemState');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  server.closeAllConnections();

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await pool.end();
});

const sendRequest = async (path, options = {}) => {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};

test('GET telemetry của zone hợp lệ trả về HTTP 200', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/zones/ZONE-STRAWBERRY-01/telemetry/latest'
  );

  assert.equal(response.status, 200);
});

test('GET telemetry của zone không tồn tại trả về HTTP 404', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/zones/ZONE-INVALID/telemetry/latest'
  );

  assert.equal(response.status, 404);
});

test('Điều khiển actuator hợp lệ trả về HTTP 200', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/actuators/control',
    {
      method: 'POST',
      body: JSON.stringify({
        zoneId: 'ZONE-STRAWBERRY-01',
        actuatorType: 'VENTILATION_FAN',
        action: 'TURN_OFF'
      })
    }
  );

  assert.equal(response.status, 200);
});

test('Điều khiển zone không tồn tại trả về HTTP 404', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/actuators/control',
    {
      method: 'POST',
      body: JSON.stringify({
        zoneId: 'ZONE-INVALID',
        actuatorType: 'VENTILATION_FAN',
        action: 'TURN_ON'
      })
    }
  );

  assert.equal(response.status, 404);
});

test('Actuator không hợp lệ trả về HTTP 400', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/actuators/control',
    {
      method: 'POST',
      body: JSON.stringify({
        zoneId: 'ZONE-STRAWBERRY-01',
        actuatorType: 'INVALID_ACTUATOR',
        action: 'TURN_ON'
      })
    }
  );

  assert.equal(response.status, 400);
});

test('Action không hợp lệ trả về HTTP 400', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/actuators/control',
    {
      method: 'POST',
      body: JSON.stringify({
        zoneId: 'ZONE-STRAWBERRY-01',
        actuatorType: 'VENTILATION_FAN',
        action: 'INVALID_ACTION'
      })
    }
  );

  assert.equal(response.status, 400);
});

test('Máy bơm bị chặn khi mực nước dưới 15%', async () => {
  const response = await sendRequest(
    '/api/v1/greenhouse/actuators/control',
    {
      method: 'POST',
      body: JSON.stringify({
        zoneId: 'ZONE-STRAWBERRY-01',
        actuatorType: 'IRRIGATION_PUMP',
        action: 'TURN_ON'
      })
    }
  );

  assert.equal(response.status, 400);
});


test('Máy bơm được lưu vào PostgreSQL với thời gian tưới tối đa 120 giây', async () => {
  const originalWaterTankLevel = systemState.waterTankLevel;
  const originalPumpStatus =
    systemState.zones['ZONE-STRAWBERRY-01'].actuatorsState.IRRIGATION_PUMP;

  let commandId;

  systemState.waterTankLevel = 50;

  try {
    const response = await sendRequest(
      '/api/v1/greenhouse/actuators/control',
      {
        method: 'POST',
        body: JSON.stringify({
          zoneId: 'ZONE-STRAWBERRY-01',
          actuatorType: 'IRRIGATION_PUMP',
          action: 'TURN_ON',
          durationSeconds: 500
        })
      }
    );

    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.success, true);

    commandId = result.data.commandId;

    const { rows } = await pool.query(
      `
        SELECT actuator_type, action, duration_seconds, execution_status
        FROM actuator_commands
        WHERE command_id = $1
      `,
      [commandId]
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0].actuator_type, 'IRRIGATION_PUMP');
    assert.equal(rows[0].action, 'TURN_ON');
    assert.equal(rows[0].duration_seconds, 120);
    assert.equal(rows[0].execution_status, 'EXECUTING');
  } finally {
    if (commandId) {
      await pool.query(
        'DELETE FROM actuator_commands WHERE command_id = $1',
        [commandId]
      );
    }

    systemState.waterTankLevel = originalWaterTankLevel;
    systemState.zones['ZONE-STRAWBERRY-01'].actuatorsState.IRRIGATION_PUMP =
      originalPumpStatus;
  }
});
