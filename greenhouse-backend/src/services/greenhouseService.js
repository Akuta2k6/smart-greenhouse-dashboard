
const systemState = require('../data/systemState');
const { validateActuatorCommand } = require('../rules/actuatorRules');

const getLatestTelemetry = (zoneId) => {
  const zone = systemState.zones[zoneId];

  if (!zone) {
    return null;
  }

  zone.metrics.temperature = +(
    zone.metrics.temperature + (Math.random() * 0.4 - 0.2)
  ).toFixed(1);

  return zone;
};

const controlActuator = (payload) => {
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
      commandId: `CMD-${Date.now()}`,
      zoneId,
      actuatorType,
      action,
      actuatorStatus,
      status: 'EXECUTING',
      executedAt: new Date().toISOString()
    }
  };
};

module.exports = {
  getLatestTelemetry,
  controlActuator
};
