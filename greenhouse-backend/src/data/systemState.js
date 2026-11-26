
const systemState = {
  waterTankLevel: 12.0,
  zones: {
    'ZONE-STRAWBERRY-01': {
      zoneId: 'ZONE-STRAWBERRY-01',
      zoneName: 'Khu 1 - Dâu Hana (Nhật Bản)',
      status: 'OPTIMAL',
      metrics: {
        temperature: 23.5,
        airHumidity: 68.2,
        soilHumidity: 64.5,
        lightLux: 24500,
        ecValue: 1.42,
        phValue: 6.05
      },
      actuatorsState: {
        IRRIGATION_PUMP: 'OFF',
        VENTILATION_FAN: 'ON',
        SHADE_NET: 'CLOSED',
        FOG_HEATER: 'OFF'
      }
    },
    'ZONE-STRAWBERRY-02': {
      zoneId: 'ZONE-STRAWBERRY-02',
      zoneName: 'Khu 2 - Dâu Tochiotome',
      status: 'WARNING',
      metrics: {
        temperature: 29.2,
        airHumidity: 52.0,
        soilHumidity: 55.0,
        lightLux: 31000,
        ecValue: 1.85,
        phValue: 5.40
      },
      actuatorsState: {
        IRRIGATION_PUMP: 'OFF',
        VENTILATION_FAN: 'ON',
        SHADE_NET: 'OPEN',
        FOG_HEATER: 'OFF'
      }
    },
    'ZONE-STRAWBERRY-03': {
      zoneId: 'ZONE-STRAWBERRY-03',
      zoneName: 'Khu 3 - Dâu Shizuka Premium',
      status: 'OPTIMAL',
      metrics: {
        temperature: 21.8,
        airHumidity: 71.0,
        soilHumidity: 78.0,
        lightLux: 19000,
        ecValue: 1.35,
        phValue: 6.10
      },
      actuatorsState: {
        IRRIGATION_PUMP: 'OFF',
        VENTILATION_FAN: 'OFF',
        SHADE_NET: 'CLOSED',
        FOG_HEATER: 'OFF'
      }
    }
  }
};

module.exports = systemState;
