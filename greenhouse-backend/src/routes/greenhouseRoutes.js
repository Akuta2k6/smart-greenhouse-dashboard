
const express = require('express');
const router = express.Router();

const {
  getTelemetryLatest
} = require('../controllers/telemetryController');

const {
  controlActuatorHandler
} = require('../controllers/actuatorController');

router.get(
  '/greenhouse/zones/:zoneId/telemetry/latest',
  getTelemetryLatest
);

router.post(
  '/greenhouse/actuators/control',
  controlActuatorHandler
);

module.exports = router;
