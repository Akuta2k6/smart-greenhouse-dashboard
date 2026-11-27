
const {
  controlActuator,
  getZoneActuators
} = require('../services/greenhouseService');

const controlActuatorHandler = async (req, res) => {
  const result = await controlActuator(req.body);

  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      errorCode: result.errorCode,
      message: result.message
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    data: result.data
  });
};

const getZoneActuatorsHandler = async (req, res) => {
  const { zoneId } = req.params;
  const actuators = await getZoneActuators(zoneId);

  if (actuators.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Không tìm thấy thiết bị tại khu vực ${zoneId}.`
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      zoneId,
      actuators
    }
  });
};

module.exports = {
  controlActuatorHandler,
  getZoneActuatorsHandler
};
