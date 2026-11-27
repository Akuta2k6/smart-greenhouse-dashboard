const { getIncidents } = require('../services/incidentService');

const getIncidentsHandler = async (req, res) => {
  const zoneId = req.query.zoneId || null;
  const incidents = await getIncidents(zoneId);

  return res.status(200).json({
    success: true,
    code: 200,
    data: {
      total: incidents.length,
      incidents
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getIncidentsHandler
};