const shouldSkipManualOverride = (decision, manualOverrideActive) => {
  return decision.mode !== 'FAILSAFE' && manualOverrideActive;
};

module.exports = {
  shouldSkipManualOverride
};
