
const { controlActuator } = require('../services/greenhouseService');

const controlActuatorHandler = async (req, res) => {
  const result = await controlActuator(req.body);

  if (!result.success) {
    return res.status(result.status).json({
      success: false,
      code: result.status,
      errorCode: result.errorCode,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    success: true,
    code: 200,
    message: result.message,
    data: result.data,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  controlActuatorHandler
};
