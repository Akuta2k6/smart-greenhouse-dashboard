const { runRuleEngine } = require('../services/ruleEngineService');

const RULE_ENGINE_INTERVAL_MS = 5000;

let intervalId = null;
let isRunning = false;

const runJob = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const result = await runRuleEngine();

    if (
      result.executedCommands.length > 0 ||
      result.staleZones.length > 0 ||
      result.errors.length > 0
    ) {
      console.log('Rule Engine:', JSON.stringify(result));
    }
  } catch (error) {
    console.error('Rule Engine failed:', error);
  } finally {
    isRunning = false;
  }
};

const startRuleEngineJob = () => {
  if (intervalId) {
    return;
  }

  runJob();
  intervalId = setInterval(runJob, RULE_ENGINE_INTERVAL_MS);

  console.log(`Rule Engine started: ${RULE_ENGINE_INTERVAL_MS / 1000}s interval.`);
};

const stopRuleEngineJob = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startRuleEngineJob,
  stopRuleEngineJob,
  runJob
};
