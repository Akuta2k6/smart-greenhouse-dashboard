
const { getLatestTelemetry } = require('../services/greenhouseService');

const getTelemetryLatest = async (req, res) => {
  const { zoneId } = req.params;
  const zoneData = await getLatestTelemetry(zoneId);

  if (!zoneData) {
    return res.status(404).json({
      success: false,
      code: 404,
      errorCode: 'ERR_ZONE_OR_TELEMETRY_NOT_FOUND',
      message: `Không tìm thấy dữ liệu telemetry cho khu vực: ${zoneId}`,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    success: true,
    code: 200,
    data: zoneData,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getTelemetryLatest
};
