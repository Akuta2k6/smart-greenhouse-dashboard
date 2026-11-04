const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Dữ liệu giả lập mô phỏng phần cứng IoT tại nhà kính (In-memory database)
let systemState = {
  waterTankLevel: 12.0, // Cố tình để dưới 15% để test lỗi Failsafe
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
        SHADE_NET: 'CLOSED'
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
        SHADE_NET: 'OPEN'
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
        SHADE_NET: 'CLOSED'
      }
    }
  }
};

// 1. API Lấy thông số Telemetry mới nhất theo Zone (Khớp với API Contract)
app.get('/api/v1/greenhouse/zones/:zoneId/telemetry/latest', (req, res) => {
  const { zoneId } = req.params;
  const zoneData = systemState.zones[zoneId];

  if (!zoneData) {
    return res.status(404).json({
      success: false,
      code: 404,
      message: `Không tìm thấy thông tin cho vùng trồng: ${zoneId}`,
      timestamp: new Date().toISOString()
    });
  }

  // Giả lập biến động nhẹ nhiệt độ ngẫu nhiên theo thời gian thực
  zoneData.metrics.temperature = +(zoneData.metrics.temperature + (Math.random() * 0.4 - 0.2)).toFixed(1);

  return res.status(200).json({
    success: true,
    code: 200,
    data: zoneData,
    timestamp: new Date().toISOString()
  });
});

// 2. API Điều khiển thiết bị thủ công / Manual Override & Kiểm tra Failsafe
app.post('/api/v1/greenhouse/actuators/control', (req, res) => {
  const { zoneId, actuatorType, action } = req.body;

  // Kiểm tra quy tắc an toàn Failsafe: Mức nước bồn chứa < 15% thì cấm bật bơm tưới
  if (actuatorType === 'IRRIGATION_PUMP' && action === 'TURN_ON' && systemState.waterTankLevel < 15.0) {
    return res.status(400).json({
      success: false,
      code: 400,
      errorCode: 'ERR_WATER_TANK_DEPLETED',
      message: `Không thể bật bơm do mức nước bồn hiện tại là ${systemState.waterTankLevel}% (< 15.0%).`,
      timestamp: new Date().toISOString()
    });
  }

  // Cập nhật trạng thái thiết bị nếu hợp lệ
  if (systemState.zones[zoneId]) {
    systemState.zones[zoneId].actuatorsState[actuatorType] = action === 'TURN_ON' ? 'ON' : 'OFF';
  }

  return res.status(200).json({
    success: true,
    code: 200,
    message: `Lệnh điều khiển ${actuatorType} thành công (${action}).`,
    data: {
      commandId: `CMD-${Date.now()}`,
      zoneId,
      actuatorType,
      status: 'EXECUTING',
      executedAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Khởi động Server
app.listen(PORT, () => {
  console.log(`🚀 Smart Greenhouse Backend đang chạy tại: http://localhost:${PORT}`);
});