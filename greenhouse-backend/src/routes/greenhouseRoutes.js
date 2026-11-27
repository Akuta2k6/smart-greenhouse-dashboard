
const express = require('express');
const router = express.Router();

const {
  getTelemetryLatest
} = require('../controllers/telemetryController');

const {
  controlActuatorHandler,
  getZoneActuatorsHandler
} = require('../controllers/actuatorController');

const {
  getIncidentsHandler
} = require('../controllers/incidentController');

router.get(
  '/greenhouse/zones/:zoneId/telemetry/latest',
  getTelemetryLatest
);

router.get(
  '/greenhouse/zones/:zoneId/actuators',
  getZoneActuatorsHandler
);

router.post(
  '/greenhouse/actuators/control',
  controlActuatorHandler
);

router.get(
  '/greenhouse/incidents',
  getIncidentsHandler
);

module.exports = router;
