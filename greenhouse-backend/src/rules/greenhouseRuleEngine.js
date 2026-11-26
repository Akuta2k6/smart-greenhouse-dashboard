const evaluateZoneRules = (telemetry, actuatorStates) => {
  const { temperature, airHumidity, soilHumidity, waterTankLevel } = telemetry.metrics;
  const decisions = [];

  const addDecision = (actuatorType, action, reason, mode = 'AUTO') => {
    decisions.push({ actuatorType, action, reason, mode });
  };

  if (waterTankLevel !== null && waterTankLevel <= 15) {
    if (actuatorStates.IRRIGATION_PUMP === 'ON') {
      addDecision('IRRIGATION_PUMP', 'TURN_OFF', 'Mực nước bồn <= 15%, kích hoạt FAILSAFE.', 'FAILSAFE');
    }
  } else if (soilHumidity !== null) {
    if (soilHumidity >= 80 && actuatorStates.IRRIGATION_PUMP === 'ON') {
      addDecision('IRRIGATION_PUMP', 'TURN_OFF', 'Độ ẩm đất đạt 80%, kết thúc tưới sớm.');
    } else if (
      soilHumidity < 60 &&
      waterTankLevel !== null &&
      waterTankLevel > 15 &&
      actuatorStates.IRRIGATION_PUMP !== 'ON'
    ) {
      addDecision('IRRIGATION_PUMP', 'TURN_ON', 'Độ ẩm đất dưới 60% và bồn nước trên 15%.');
    }
  }

  if (temperature !== null && airHumidity !== null) {
    const ventilationRequired = temperature > 30 || airHumidity > 80;
    const ventilationCanStop = temperature <= 25 && airHumidity <= 75;

    if (ventilationRequired && actuatorStates.VENTILATION_FAN !== 'ON') {
      addDecision('VENTILATION_FAN', 'TURN_ON', 'Nhiệt độ > 30°C hoặc độ ẩm không khí > 80%.');
    } else if (ventilationCanStop && actuatorStates.VENTILATION_FAN === 'ON') {
      addDecision('VENTILATION_FAN', 'TURN_OFF', 'Nhiệt độ <= 25°C và độ ẩm không khí <= 75%.');
    }
  }

  if (temperature !== null) {
    if (temperature > 30 && actuatorStates.SHADE_NET !== 'OPEN') {
      addDecision('SHADE_NET', 'TURN_ON', 'Nhiệt độ > 30°C, mở lưới che.');
    } else if (temperature <= 25 && actuatorStates.SHADE_NET !== 'CLOSED') {
      addDecision('SHADE_NET', 'TURN_OFF', 'Nhiệt độ <= 25°C, đóng lưới che.');
    }

    if (temperature < 18 && actuatorStates.FOG_HEATER !== 'ON') {
      addDecision('FOG_HEATER', 'TURN_ON', 'Nhiệt độ < 18°C, bật thiết bị sưởi.');
    } else if (
      (temperature >= 20 || temperature > 30) &&
      actuatorStates.FOG_HEATER === 'ON'
    ) {
      addDecision('FOG_HEATER', 'TURN_OFF', 'Nhiệt độ >= 20°C hoặc vượt ngưỡng an toàn.');
    }
  }

  return decisions;
};

module.exports = {
  evaluateZoneRules
};
