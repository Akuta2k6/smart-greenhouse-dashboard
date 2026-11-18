
const ALLOWED_ACTIONS = ['TURN_ON', 'TURN_OFF'];

const ALLOWED_ACTUATORS = [
  'IRRIGATION_PUMP',
  'VENTILATION_FAN',
  'SHADE_NET'
];

const validateActuatorCommand = (systemState, payload) => {
  const { zoneId, actuatorType, action } = payload || {};

  if (!zoneId || !actuatorType || !action) {
    return {
      valid: false,
      status: 400,
      errorCode: 'ERR_INVALID_REQUEST',
      message: 'Vui lòng cung cấp zoneId, actuatorType và action.'
    };
  }

  const zone = systemState.zones[zoneId];

  if (!zone) {
    return {
      valid: false,
      status: 404,
      errorCode: 'ERR_ZONE_NOT_FOUND',
      message: `Không tìm thấy khu vực: ${zoneId}.`
    };
  }

  if (
    !ALLOWED_ACTUATORS.includes(actuatorType) ||
    !Object.hasOwn(zone.actuatorsState, actuatorType)
  ) {
    return {
      valid: false,
      status: 400,
      errorCode: 'ERR_INVALID_ACTUATOR',
      message: `Thiết bị ${actuatorType} không được hỗ trợ tại khu vực này.`
    };
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return {
      valid: false,
      status: 400,
      errorCode: 'ERR_INVALID_ACTION',
      message: 'Hành động chỉ được phép là TURN_ON hoặc TURN_OFF.'
    };
  }

  if (
    actuatorType === 'IRRIGATION_PUMP' &&
    action === 'TURN_ON' &&
    systemState.waterTankLevel < 15.0
  ) {
    return {
      valid: false,
      status: 400,
      errorCode: 'ERR_WATER_TANK_DEPLETED',
      message: `Không thể bật bơm do mức nước bồn hiện tại là ${systemState.waterTankLevel}% (< 15.0%).`
    };
  }

  return { valid: true };
};

module.exports = {
  validateActuatorCommand
};
