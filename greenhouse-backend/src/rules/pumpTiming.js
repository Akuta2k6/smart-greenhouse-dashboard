const PUMP_MAX_RUNTIME_SECONDS = 120;
const PUMP_COOLDOWN_SECONDS = 15 * 60;

const getElapsedSeconds = (timestamp, now = Date.now()) => {
  if (!timestamp) {
    return null;
  }

  const timestampMilliseconds = new Date(timestamp).getTime();

  if (!Number.isFinite(timestampMilliseconds)) {
    return null;
  }

  return (now - timestampMilliseconds) / 1000;
};

const isPumpRuntimeExpired = (startedAt, now = Date.now()) => {
  const elapsedSeconds = getElapsedSeconds(startedAt, now);

  return elapsedSeconds !== null &&
    elapsedSeconds >= PUMP_MAX_RUNTIME_SECONDS;
};

const isPumpCooldownActive = (stoppedAt, now = Date.now()) => {
  const elapsedSeconds = getElapsedSeconds(stoppedAt, now);

  return elapsedSeconds !== null &&
    elapsedSeconds < PUMP_COOLDOWN_SECONDS;
};

const shouldBlockPumpStart = (cooldownActive, mode = 'AUTO') => {
  return cooldownActive && mode === 'AUTO';
};

module.exports = {
  PUMP_MAX_RUNTIME_SECONDS,
  PUMP_COOLDOWN_SECONDS,
  isPumpRuntimeExpired,
  isPumpCooldownActive,
  shouldBlockPumpStart
};
