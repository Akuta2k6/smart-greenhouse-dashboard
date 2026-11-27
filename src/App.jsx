import React, { useState, useEffect } from 'react';
import apiClient, { getTelemetryLatest, getZoneActuators } from './services/api';
import GreenhouseMap from './components/GreenhouseMap';
import { 
  Thermometer, 
  Droplet, 
  Sun, 
  Activity, 
  AlertTriangle, 
  Power, 
  ShieldAlert, 
  Layers, 
  Wifi,
  WifiOff,
  Sliders,
  AlertOctagon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  // Ánh xạ sang mã Zone chuẩn theo API Contract (Ví dụ: ZONE-STRAWBERRY-01)
  const [selectedZone, setSelectedZone] = useState('ZONE-STRAWBERRY-01');
  const [isOnline, setIsOnline] = useState(true);
  const [waterTankLevel, setWaterTankLevel] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);

  // Danh sách các vùng chuẩn theo tài liệu API Contract[cite: 5]
  const [zonesData, setZonesData] = useState({
    'ZONE-STRAWBERRY-01': {
      name: 'Khu 1 - Dâu Hana (Nhật Bản)',
      status: 'OPTIMAL',
      temp: 23.5,
      airHumid: 68.2,
      soilHumid: 64.5,
      light: 24500,
      ec: 1.42,
      ph: 6.05
    },
    'ZONE-STRAWBERRY-02': {
      name: 'Khu 2 - Dâu Tochiotome',
      status: 'WARNING',
      temp: 29.2,
      airHumid: 52.0,
      soilHumid: 55.0,
      light: 31000,
      ec: 1.85,
      ph: 5.40
    },
    'ZONE-STRAWBERRY-03': {
      name: 'Khu 3 - Dâu Shizuka Premium',
      status: 'OPTIMAL',
      temp: 21.8,
      airHumid: 71.0,
      soilHumid: 78.0,
      light: 19000,
      ec: 1.35,
      ph: 6.10
    }
  });

  const actuatorConfig = {
    IRRIGATION_PUMP: { name: 'Bơm tưới nhỏ giọt', pin: 'GPIO 25' },
    VENTILATION_FAN: { name: 'Quạt thông gió đối lưu', pin: 'GPIO 26' },
    SHADE_NET: { name: 'Lưới che nắng tự động', pin: 'GPIO 27' },
    FOG_HEATER: { name: 'Bộ phun sương / tạo ẩm', pin: 'GPIO 14' },
    NUTRIENT_VALVE: { name: 'Van châm phân tự động (EC/pH)', pin: 'GPIO 32' }
  };

  const [actuatorsByZone, setActuatorsByZone] = useState({});
  const [actuatorLoading, setActuatorLoading] = useState(false);
  const [actuatorBusy, setActuatorBusy] = useState({});

  // Nhật ký sự cố và mã lỗi chi tiết[cite: 5]
  const [incidents, setIncidents] = useState([
    { id: 1, code: 'ERR_WATER_TANK_DEPLETED', title: 'Mức nước bồn chứa thấp nguy hiểm', zone: 'Hệ thống chung', time: '5 phút trước', severity: 'CRITICAL', status: 'Active', message: 'Mức nước hiện tại 12.0% (< 15%). Rơ-le bơm tưới đã bị khóa tự động để bảo vệ phần cứng.' },
    { id: 2, code: 'ERR_HIGH_TEMP_WARNING', title: 'Cảnh báo nhiệt độ vượt ngưỡng', zone: 'Khu 2', time: '25 phút trước', severity: 'WARNING', message: 'Nhiệt độ Khu 2 đạt 29.2°C. Quạt thông gió đã được kích hoạt tăng cường công suất.' },
    { id: 3, code: 'INFO_CYCLE_COMPLETE', title: 'Hoàn thành chu kỳ tưới dinh dưỡng', zone: 'Khu 1', time: '1 giờ trước', message: 'Hệ thống đã tự động cấp nước và dung dịch EC 1.4 mS/cm trong 10 phút.' },
    { id: 4, code: 'ERR_SENSOR_TIMEOUT', title: 'Mất kết nối tạm thời cảm biến pH', zone: 'Khu 3', time: '3 giờ trước', message: 'Cảm biến phản hồi chậm > 3000ms. Đã tự động khởi động lại giao thức I2C thành công.' }
  ]);

  const zoneIds = [
    'ZONE-STRAWBERRY-01',
    'ZONE-STRAWBERRY-02',
    'ZONE-STRAWBERRY-03'
  ];

  const refreshZoneActuators = async (zoneId) => {
    const response = await getZoneActuators(zoneId);
    if (!response?.success || !Array.isArray(response.data?.actuators)) {
      throw new Error(`Không thể lấy trạng thái thiết bị của ${zoneId}.`);
    }

    const mapped = Object.fromEntries(
      response.data.actuators.map((item) => [item.actuatorType, item])
    );

    setActuatorsByZone((prev) => ({
      ...prev,
      [zoneId]: mapped
    }));

    return mapped;
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId;
    let firstLoad = true;

    const fetchDashboardData = async () => {
      if (firstLoad) {
        setLoadingApi(true);
        setActuatorLoading(true);
      }

      try {
        const results = await Promise.allSettled(
          zoneIds.map(async (zoneId) => {
            const [telemetryResult, actuatorResult] = await Promise.allSettled([
              getTelemetryLatest(zoneId),
              getZoneActuators(zoneId)
            ]);
            return {
              zoneId,
              telemetry: telemetryResult.status === 'fulfilled' ? telemetryResult.value : null,
              actuatorResponse: actuatorResult.status === 'fulfilled' ? actuatorResult.value : null
            };
          })
        );

        if (cancelled) return;

        const validUpdates = results.flatMap((result) => {
          if (result.status !== 'fulfilled') return [];
          const { zoneId, telemetry } = result.value;
          if (!telemetry?.success || !telemetry.data?.metrics) return [];
          return [{ zoneId, data: telemetry.data }];
        });

        if (validUpdates.length > 0) {
          setZonesData((prev) => {
            const updated = { ...prev };
            validUpdates.forEach(({ zoneId, data }) => {
              updated[zoneId] = {
                ...prev[zoneId],
                name: data.zoneName,
                status: data.status,
                temp: data.metrics.temperature,
                airHumid: data.metrics.airHumidity,
                soilHumid: data.metrics.soilHumidity,
                light: data.metrics.lightLux,
                ec: data.metrics.ecValue,
                ph: data.metrics.phValue
              };
            });
            return updated;
          });

          const tankValue = validUpdates.find(
            ({ data }) => data.metrics.waterTankLevel !== null && data.metrics.waterTankLevel !== undefined
          )?.data.metrics.waterTankLevel;
          setWaterTankLevel(tankValue ?? null);
        }

        const actuatorUpdates = results.flatMap((result) => {
          if (result.status !== 'fulfilled') return [];
          const { zoneId, actuatorResponse } = result.value;
          if (!actuatorResponse?.success || !Array.isArray(actuatorResponse.data?.actuators)) return [];
          return [{ zoneId, actuators: actuatorResponse.data.actuators }];
        });

        if (actuatorUpdates.length > 0) {
          setActuatorsByZone((prev) => {
            const updated = { ...prev };
            actuatorUpdates.forEach(({ zoneId, actuators }) => {
              updated[zoneId] = Object.fromEntries(
                actuators.map((item) => [item.actuatorType, item])
              );
            });
            return updated;
          });
        }

        setIsOnline(validUpdates.length === zoneIds.length);
        if (firstLoad) setActuatorLoading(false);
      } catch (error) {
        if (!cancelled) {
          console.error('Không thể đồng bộ dữ liệu nhà kính:', error.message);
          setIsOnline(false);
        }
      } finally {
        if (firstLoad) {
          setLoadingApi(false);
          setActuatorLoading(false);
          firstLoad = false;
        }
        if (!cancelled) timeoutId = setTimeout(fetchDashboardData, 5000);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleToggleActuator = async (actuatorKey, requestedAction) => {
    const currentActuator = actuatorsByZone[selectedZone]?.[actuatorKey];

    if (!currentActuator) {
      alert('Chưa tải được trạng thái thiết bị. Vui lòng thử lại.');
      return;
    }

    if (currentActuator.status === 'UNKNOWN' && !requestedAction) {
      alert('Thiết bị chưa có trạng thái trước đó. Hãy chọn rõ Bật hoặc Tắt trong bảng điều khiển.');
      return;
    }

    if (currentActuator.deviceStatus !== 'ACTIVE') {
      alert(`Thiết bị hiện không sẵn sàng: ${currentActuator.deviceStatus || 'UNKNOWN'}.`);
      return;
    }

    const isOn = currentActuator.status === 'ON' || currentActuator.status === 'OPEN';
    const targetAction = requestedAction || (isOn ? 'TURN_OFF' : 'TURN_ON');

    if (actuatorKey === 'IRRIGATION_PUMP' && targetAction === 'TURN_ON' && (waterTankLevel === null || waterTankLevel < 15)) {
      alert(waterTankLevel === null
        ? 'Chưa có dữ liệu mực nước bồn. Không thể kích hoạt bơm tưới.'
        : 'Mực nước bồn chứa dưới 15%. Không thể kích hoạt bơm tưới!');
      return;
    }

    const busyKey = `${selectedZone}:${actuatorKey}`;
    setActuatorBusy((prev) => ({ ...prev, [busyKey]: true }));

    try {
      const response = await apiClient.post('/greenhouse/actuators/control', {
        zoneId: selectedZone,
        actuatorType: actuatorKey,
        action: targetAction,
        ...(actuatorKey === 'IRRIGATION_PUMP' && targetAction === 'TURN_ON'
          ? { durationSeconds: 120 }
          : {})
      });

      if (!response.data?.success) {
        alert(response.data?.message || 'Backend không xác nhận lệnh điều khiển.');
        return;
      }

      await refreshZoneActuators(selectedZone);
      alert(response.data.message || 'Điều khiển thiết bị thành công!');
    } catch (error) {
      const errData = error.response?.data;
      if (errData) {
        alert(`LỖI [${errData.errorCode || errData.code || 'API_ERROR'}]: ${errData.message || 'Không thể thực hiện lệnh.'}`);
      } else {
        alert(error.message || 'Không thể kết nối Backend.');
      }
    } finally {
      setActuatorBusy((prev) => ({ ...prev, [busyKey]: false }));
    }
  };

  const getActuatorLabel = (actuator) => {
    if (!actuator) return 'Chưa tải';
    if (actuator.deviceStatus !== 'ACTIVE') return actuator.deviceStatus || 'Không xác định';
    if (actuator.status === 'UNKNOWN') return 'Chưa xác định';
    if (actuator.status === 'OPEN') return 'Đang mở';
    if (actuator.status === 'CLOSED') return 'Đang đóng';
    return actuator.status === 'ON' ? 'Đang bật' : 'Đã tắt';
  };

  const getActuatorStyle = (actuator) => {
    if (!actuator || actuator.status === 'UNKNOWN') return 'bg-amber-500/15 text-amber-300';
    if (actuator.deviceStatus !== 'ACTIVE') return 'bg-rose-500/15 text-rose-300';
    if (actuator.status === 'ON' || actuator.status === 'OPEN') return 'bg-emerald-500/15 text-emerald-300';
    return 'bg-slate-700 text-slate-300';
  };

  const currentZone = zonesData[selectedZone] || zonesData['ZONE-STRAWBERRY-01'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-600/30">
              🍓
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-emerald-400">Smart Strawberry</h1>
              <p className="text-xs text-slate-400">IoT Greenhouse v1.2</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'overview' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <Activity className="w-5 h-5" />
              <span>Tổng quan Telemetry</span>
            </button>
            <button 
              onClick={() => setActiveTab('zones')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'zones' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <Layers className="w-5 h-5" />
              <span>Sơ đồ Vùng (Zones)</span>
            </button>
            <button 
              onClick={() => setActiveTab('actuators')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'actuators' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <Power className="w-5 h-5" />
              <span>Điều khiển Actuators</span>
            </button>
            <button 
              onClick={() => setActiveTab('incidents')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'incidents' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Nhật ký Sự cố & Lỗi</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
              <span className="text-xs font-medium text-slate-300">REST API</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
              {isOnline ? 'Connected' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* HEADER BAR */}
        <header className="h-20 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'overview' && 'Giám sát Môi trường Nhà kính Real-time'}
              {activeTab === 'zones' && 'Sơ đồ Vùng Trồng & Thông số Chi tiết'}
              {activeTab === 'actuators' && 'Bảng Điều khiển Thiết bị Chấp hành (Actuators)'}
              {activeTab === 'incidents' && 'Quản lý Sự cố & Mã lỗi Hệ thống (Failsafe Logs)'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {activeTab === 'overview' && (
              <select 
                value={selectedZone} 
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-sm rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(zonesData).map(key => (
                  <option key={key} value={key}>{zonesData[key].name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${loadingApi ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
              <span className="text-xs font-medium text-slate-300">{loadingApi ? 'Syncing API...' : 'Live Stream'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="p-8 space-y-8">

          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <>
              {/* KPI CARDS METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-400">Nhiệt độ không khí</span>
                    <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl"><Thermometer className="w-5 h-5" /></div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">{currentZone.temp}°C</span>
                    <span className="text-xs text-emerald-400 font-medium">Tối ưu (18-25°C)</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(currentZone.temp / 40) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-400">Độ ẩm đất (Soil Humid)</span>
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl"><Droplet className="w-5 h-5" /></div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">{currentZone.soilHumid}%</span>
                    <span className="text-xs text-emerald-400 font-medium">Mục tiêu 60-80%</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${currentZone.soilHumid}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-400">Độ dẫn điện (EC)</span>
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl"><Activity className="w-5 h-5" /></div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">{currentZone.ec}</span>
                    <span className="text-xs text-slate-400">mS/cm</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(currentZone.ec / 3) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-400">Độ pH Dinh dưỡng</span>
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl"><Sun className="w-5 h-5" /></div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">{currentZone.ph}</span>
                    <span className="text-xs text-emerald-400 font-medium">Chuẩn 5.8-6.2</span>
                  </div>
                  <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(currentZone.ph / 14) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* SECTION: ACTUATORS QUICK VIEW & WATER TANK */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-white">Bảng điều khiển Nhanh Thiết bị</h3>
                      <p className="text-xs text-slate-400">Nhấn vào công tắc để gửi lệnh API Manual Override.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(actuatorConfig).map((key) => {
                      const act = actuatorsByZone[selectedZone]?.[key];
                      const busy = actuatorBusy[`${selectedZone}:${key}`];
                      const canToggle = act?.status !== 'UNKNOWN' && act?.deviceStatus === 'ACTIVE' && !busy;
                      const isOn = act?.status === 'ON' || act?.status === 'OPEN';
                      return (
                        <div key={key} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-slate-200">{actuatorConfig[key].name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${getActuatorStyle(act)}`}>
                                {getActuatorLabel(act)}
                              </span>
                              <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-md">{act?.mode || 'Chưa có lệnh'}</span>
                            </div>
                          </div>
                          {act?.status === 'UNKNOWN' && act?.deviceStatus === 'ACTIVE' ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleToggleActuator(key, 'TURN_ON')} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white">Bật</button>
                              <button onClick={() => handleToggleActuator(key, 'TURN_OFF')} className="rounded-lg bg-slate-700 px-2 py-1 text-[10px] font-semibold text-white">Tắt</button>
                            </div>
                          ) : (
                            <button
                              disabled={!canToggle}
                              onClick={() => handleToggleActuator(key)}
                              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${isOn ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                            >
                              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-2">Trữ lượng Bồn nước & Failsafe</h3>
                    <p className="text-xs text-slate-400 mb-6">Bảo vệ chống chạy khô (P-TANK-LEVEL-MIN = 15%).</p>

                    <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300 font-medium">Mức nước bồn:</span>
                        <span className="font-bold text-slate-200">{waterTankLevel === null ? '--' : `${Number(waterTankLevel).toFixed(1)}%`}</span>
                      </div>
                      <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${waterTankLevel !== null && waterTankLevel <= 15 ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${waterTankLevel === null ? 0 : Math.max(0, Math.min(100, Number(waterTankLevel)))}%` }}></div>
                      </div>
                      {waterTankLevel !== null && waterTankLevel < 15 && (
                        <p className="text-xs text-rose-400 mt-2 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>ERR_WATER_TANK_DEPLETED: Đã khóa bơm!</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`${waterTankLevel === null ? 'bg-amber-500/10 border-amber-500/20' : waterTankLevel < 15 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border p-4 rounded-xl`}>
                    <div className="flex items-start space-x-3">
                      <AlertOctagon className={`w-5 h-5 shrink-0 mt-0.5 ${waterTankLevel === null ? 'text-amber-400' : waterTankLevel < 15 ? 'text-rose-400' : 'text-emerald-400'}`} />
                      <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${waterTankLevel === null ? 'text-amber-400' : waterTankLevel < 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          Trạng thái Failsafe: {waterTankLevel === null ? 'CHƯA XÁC ĐỊNH' : waterTankLevel < 15 ? 'ACTIVE' : 'NORMAL'}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1">
                          {waterTankLevel === null ? 'Chưa có dữ liệu mực nước để đánh giá điều kiện an toàn của bơm.' : waterTankLevel < 15 ? 'Hệ thống khóa bơm tưới do mực nước dưới ngưỡng an toàn 15%.' : 'Mực nước đang trên ngưỡng an toàn. Bơm tưới được phép hoạt động nếu các điều kiện khác hợp lệ.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: ZONES MAP ================= */}
          {activeTab === 'zones' && (
            <div className="space-y-6">
              <GreenhouseMap
                zonesData={zonesData}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                waterTankLevel={waterTankLevel}
                actuatorsByZone={actuatorsByZone}
              />
            </div>
          )}

          {/* ================= TAB 3: ACTUATORS CONTROL ================= */}
          {activeTab === 'actuators' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Quản lý Thiết bị Chấp hành (Actuators Panel)</h3>
                    <p className="text-xs text-slate-400">Điều khiển rơ-le phần cứng trực tiếp qua API Endpoint.</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2">
                    <Sliders className="w-4 h-4" />
                    <span>Chế độ: Hybrid (Auto + Manual Override)</span>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <label className="text-xs text-slate-400" htmlFor="actuator-zone">Khu vực điều khiển</label>
                  <select
                    id="actuator-zone"
                    value={selectedZone}
                    onChange={(event) => setSelectedZone(event.target.value)}
                    className="bg-slate-800 border border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-200"
                  >
                    {zoneIds.map((zoneId) => <option key={zoneId} value={zoneId}>{zonesData[zoneId]?.name || zoneId}</option>)}
                  </select>
                  {actuatorLoading && <span className="text-xs text-amber-300">Đang tải trạng thái thiết bị...</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(actuatorConfig).map((key) => {
                    const act = actuatorsByZone[selectedZone]?.[key];
                    const busy = actuatorBusy[`${selectedZone}:${key}`];
                    const canToggle = act?.status !== 'UNKNOWN' && act?.deviceStatus === 'ACTIVE' && !busy;
                    const isOn = act?.status === 'ON' || act?.status === 'OPEN';
                    return (
                      <div key={key} className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{actuatorConfig[key].pin}</span>
                            <h4 className="font-bold text-sm text-white">{actuatorConfig[key].name}</h4>
                          </div>
                          <p className="text-xs text-slate-400">Trạng thái: <span className={`font-bold ${getActuatorStyle(act).replace(/bg-[^ ]+ /, '')}`}>{getActuatorLabel(act)}</span></p>
                          <p className="text-xs text-slate-400">Thiết bị: <span className="text-slate-200">{act?.deviceStatus || 'Chưa tải'}</span></p>
                          <p className="text-xs text-slate-400">Chế độ: <span className="text-amber-400 font-medium">{act?.mode || '--'}</span></p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {act?.status === 'UNKNOWN' && act?.deviceStatus === 'ACTIVE' ? (
                            <div className="flex gap-2">
                              <button disabled={busy} onClick={() => handleToggleActuator(key, 'TURN_ON')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Bật</button>
                              <button disabled={busy} onClick={() => handleToggleActuator(key, 'TURN_OFF')} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Tắt</button>
                            </div>
                          ) : (
                            <button
                              disabled={!canToggle}
                              onClick={() => handleToggleActuator(key)}
                              className={`w-14 h-7 flex items-center rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${isOn ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                            >
                              <div className="bg-white w-5 h-5 rounded-full shadow-md"></div>
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500">{busy ? 'Đang gửi lệnh' : canToggle || act?.status === 'UNKNOWN' ? 'Có thể điều khiển' : 'Không thể điều khiển'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: INCIDENTS & ERRORS ================= */}
          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Nhật ký Sự cố & Mã lỗi Hệ thống (Incident & Error Log)</h3>
                    <p className="text-xs text-slate-400">Lịch sử ghi nhận các ngoại lệ phần cứng, cảnh báo cảm biến và cơ chế kích hoạt Failsafe.</p>
                  </div>
                  <button 
                    onClick={() => setIncidents([])}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 px-3 py-2 rounded-xl transition"
                  >
                    Xóa nhật ký
                  </button>
                </div>

                <div className="space-y-4">
                  {incidents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">Không có sự cố hoặc mã lỗi nào được ghi nhận.</div>
                  ) : (
                    incidents.map((incident) => (
                      <div key={incident.id} className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-xl mt-0.5 ${incident.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {incident.severity === 'CRITICAL' ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">{incident.code}</span>
                              <h4 className="text-sm font-bold text-white">{incident.title}</h4>
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">[{incident.zone}]</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1.5">{incident.message}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:flex-col md:items-end space-y-1 text-xs border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                          <span className="text-slate-400">{incident.time}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${incident.status === 'Active' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
