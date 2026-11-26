const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PUMP_MAX_RUNTIME_SECONDS,
  PUMP_COOLDOWN_SECONDS,
  isPumpRuntimeExpired,
  isPumpCooldownActive,
  shouldBlockPumpStart
} = require('../src/rules/pumpTiming');

test('Máy bơm chưa hết runtime trước 120 giây', () => {
  const now = Date.parse('2026-11-26T14:00:00.000Z');
  const startedAt = new Date(now - 119000).toISOString();

  assert.equal(PUMP_MAX_RUNTIME_SECONDS, 120);
  assert.equal(isPumpRuntimeExpired(startedAt, now), false);
});

test('Máy bơm hết runtime tại mốc 120 giây', () => {
  const now = Date.parse('2026-11-26T14:00:00.000Z');
  const startedAt = new Date(now - 120000).toISOString();

  assert.equal(isPumpRuntimeExpired(startedAt, now), true);
});

test('Cooldown vẫn hoạt động trước khi đủ 15 phút', () => {
  const now = Date.parse('2026-11-26T14:00:00.000Z');
  const stoppedAt = new Date(now - 899000).toISOString();

  assert.equal(PUMP_COOLDOWN_SECONDS, 900);
  assert.equal(isPumpCooldownActive(stoppedAt, now), true);
});

test('Cooldown kết thúc khi đủ 15 phút', () => {
  const now = Date.parse('2026-11-26T14:00:00.000Z');
  const stoppedAt = new Date(now - 900000).toISOString();

  assert.equal(isPumpCooldownActive(stoppedAt, now), false);
});

test('Cooldown chặn AUTO nhưng cho phép MANUAL_OVERRIDE', () => {
  assert.equal(shouldBlockPumpStart(true, 'AUTO'), true);
  assert.equal(shouldBlockPumpStart(true, 'MANUAL_OVERRIDE'), false);
});
