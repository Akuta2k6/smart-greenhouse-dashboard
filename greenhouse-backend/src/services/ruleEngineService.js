
const systemState = require('../data/systemState');
const { getLatestTelemetry } = require('./greenhouseService');
const {
  getManualOverrideStatus,
  getPumpTimingStatus,
  executeActuatorCommand
} = require('./actuatorService');
const { syncZoneIncidents } = require('./incidentService');
const { evaluateZoneRules } = require('../rules/greenhouseRuleEngine');
const { shouldSkipManualOverride } = require('../rules/commandPriority');
const { shouldBlockPumpStart } = require('../rules/pumpTiming');

const TELEMETRY_STALE_AFTER_SECONDS = 15;

const isTelemetryStale = (recordedAt) => {
  if (!recordedAt) {
    return true;
  }

  const ageMilliseconds = Date.now() - new Date(recordedAt).getTime();

  return !Number.isFinite(ageMilliseconds) ||
    ageMilliseconds > TELEMETRY_STALE_AFTER_SECONDS * 1000 ||
    ageMilliseconds < 0;
};

const runRuleEngine = async () => {
  const summary = {
    processedZones: 0,
    executedCommands: [],
    skippedCommands: [],
    staleZones: [],
    createdIncidents: [],
    resolvedIncidents: [],
    errors: []
  };

  for (const zoneId of Object.keys(systemState.zones)) {
    try {
      const telemetry = await getLatestTelemetry(zoneId);

      if (!telemetry || isTelemetryStale(telemetry.recordedAt)) {
        summary.staleZones.push(zoneId);

        if (
          systemState.zones[zoneId].actuatorsState.IRRIGATION_PUMP === 'ON'
        ) {
          const command = await executeActuatorCommand({
            zoneId,
            actuatorType: 'IRRIGATION_PUMP',
            action: 'TURN_OFF',
            mode: 'FAILSAFE',
            reason: 'Telemetry mất kết nối hoặc quá 15 giây.'
          });

          summary.executedCommands.push(command);
        }

        continue;
      }

      summary.processedZones += 1;
      systemState.zones[zoneId].metrics = telemetry.metrics;
      systemState.waterTankLevel = telemetry.metrics.waterTankLevel;

      try {
        const incidentResult = await syncZoneIncidents(
          zoneId,
          telemetry.metrics
        );

        summary.createdIncidents.push(...incidentResult.createdIncidents);
        summary.resolvedIncidents.push(...incidentResult.resolvedIncidents);
      } catch (error) {
        summary.errors.push({
          zoneId,
          service: 'INCIDENT',
          message: error.message
        });
      }

      const pumpTiming = await getPumpTimingStatus(zoneId);

      const decisions = evaluateZoneRules(
        telemetry,
        systemState.zones[zoneId].actuatorsState
      );

      for (const decision of decisions) {
        try {
          if (
            decision.actuatorType === 'IRRIGATION_PUMP' &&
            decision.action === 'TURN_ON' &&
            decision.mode === 'AUTO'
          ) {
            const timingStatus = await getPumpTimingStatus(zoneId);

            if (shouldBlockPumpStart(
              timingStatus.cooldownActive,
              decision.mode
            )) {
              summary.skippedCommands.push({
                zoneId,
                ...decision,
                reason: 'Máy bơm đang trong thời gian cooldown 15 phút.'
              });

              continue;
            }
          }

          if (decision.mode !== 'FAILSAFE') {
            const manualOverrideActive = await getManualOverrideStatus(
              zoneId,
              decision.actuatorType
            );

            if (shouldSkipManualOverride(decision, manualOverrideActive)) {
              summary.skippedCommands.push({
                zoneId,
                ...decision,
                reason: 'Đang trong thời gian MANUAL_OVERRIDE 15 phút.'
              });

              continue;
            }
          }

          const command = await executeActuatorCommand({
            zoneId,
            ...decision
          });

          summary.executedCommands.push(command);
        } catch (error) {
          summary.errors.push({
            zoneId,
            actuatorType: decision.actuatorType,
            message: error.message
          });
        }
      }

      if (
        systemState.zones[zoneId].actuatorsState.IRRIGATION_PUMP === 'ON' &&
        pumpTiming.isRunning &&
        pumpTiming.runtimeExpired
      ) {
        try {
          const command = await executeActuatorCommand({
            zoneId,
            actuatorType: 'IRRIGATION_PUMP',
            action: 'TURN_OFF',
            mode: 'FAILSAFE',
            reason: 'Máy bơm đã chạy đủ thời gian tối đa 120 giây.'
          });

          summary.executedCommands.push(command);
        } catch (error) {
          summary.errors.push({
            zoneId,
            actuatorType: 'IRRIGATION_PUMP',
            message: error.message
          });
        }
      }
    } catch (error) {
      summary.errors.push({
        zoneId,
        message: error.message
      });
    }
  }

  return summary;
};

module.exports = {
  runRuleEngine,
  isTelemetryStale
};
