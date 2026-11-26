const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateZoneRules } = require('../src/rules/greenhouseRuleEngine');
const { shouldSkipManualOverride } = require('../src/rules/commandPriority');

test('Mực nước dưới hoặc bằng 15% và máy bơm đang ON tạo lệnh FAILSAFE TURN_OFF', () => {
  const telemetry = {
    metrics: {
      temperature: 23.5,
      airHumidity: 68,
      soilHumidity: 55,
      waterTankLevel: 11.82
    }
  };

  const actuatorStates = {
    IRRIGATION_PUMP: 'ON',
    VENTILATION_FAN: 'OFF',
    SHADE_NET: 'CLOSED',
    FOG_HEATER: 'OFF'
  };

  const decisions = evaluateZoneRules(telemetry, actuatorStates);
  const pumpDecision = decisions.find(
    decision => decision.actuatorType === 'IRRIGATION_PUMP'
  );

  assert.deepEqual(pumpDecision, {
    actuatorType: 'IRRIGATION_PUMP',
    action: 'TURN_OFF',
    reason: 'Mực nước bồn <= 15%, kích hoạt FAILSAFE.',
    mode: 'FAILSAFE'
  });
});

test('FAILSAFE không bị bỏ qua dù MANUAL_OVERRIDE còn hiệu lực', () => {
  const decision = {
    actuatorType: 'IRRIGATION_PUMP',
    action: 'TURN_OFF',
    mode: 'FAILSAFE'
  };

  assert.equal(shouldSkipManualOverride(decision, true), false);
});

test('AUTO bị bỏ qua khi MANUAL_OVERRIDE còn hiệu lực', () => {
  const decision = {
    actuatorType: 'FOG_HEATER',
    action: 'TURN_OFF',
    mode: 'AUTO'
  };

  assert.equal(shouldSkipManualOverride(decision, true), true);
});

test('AUTO không bị bỏ qua khi MANUAL_OVERRIDE hết hiệu lực', () => {
  const decision = {
    actuatorType: 'FOG_HEATER',
    action: 'TURN_OFF',
    mode: 'AUTO'
  };

  assert.equal(shouldSkipManualOverride(decision, false), false);
});
