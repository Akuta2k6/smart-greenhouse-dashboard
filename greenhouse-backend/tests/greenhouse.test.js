
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

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
