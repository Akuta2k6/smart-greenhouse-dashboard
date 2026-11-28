import React, { useState, useEffect, useRef } from 'react';import apiClient, { getTelemetryLatest, getZoneActuators, getIncidents } from './services/api';
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

const zoneIds = Object.freeze([
  'ZONE-STRAWBERRY-01',
  'ZONE-STRAWBERRY-02',
  'ZONE-STRAWBERRY-03'
]);

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

  const [incidents, setIncidents] = useState([]);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState('');
  const [incidentZoneFilter, setIncidentZoneFilter] = useState('');

  const incidentFirstLoadRef = useRef(true);
  const dashboardFirstLoadRef = useRef(true);

  const incidentTimeoutRef = useRef(null);
  const dashboardTimeoutRef = useRef(null);

  const incidentCancelledRef = useRef(false);
  const dashboardCancelledRef = useRef(false);

  useEffect(() => {
    incidentCancelledRef.current = false;
    incidentFirstLoadRef.current = true;

    const fetchIncidents = async () => {
      if (incidentFirstLoadRef.current) setIncidentLoading(true);

      try {
        const response = await getIncidents(incidentZoneFilter || null);
        if (incidentCancelledRef.current) return;

        if (!response?.success || !Array.isArray(response.data?.incidents)) {
          throw new Error('Dữ liệu sự cố từ Backend không đúng định dạng.');
        }

        setIncidents(response.data.incidents);
        setIncidentError('');
      } catch (error) {
        if (!incidentCancelledRef.current) {
          setIncidentError(error.response?.data?.message || error.message || 'Không thể tải danh sách sự cố.');
        }
      } finally {
        if (incidentFirstLoadRef.current) {
          setIncidentLoading(false);
          incidentFirstLoadRef.current = false;
        }
        if (!incidentCancelledRef.current) {
          incidentTimeoutRef.current = setTimeout(fetchIncidents, 5000);
        }
      }
    };

    fetchIncidents();

    return () => {
      incidentCancelledRef.current = true;
      clearTimeout(incidentTimeoutRef.current);
    };
  }, [incidentZoneFilter]);

  const formatIncidentDate = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('vi-VN');
  };

  const getIncidentPriority = (priority) => ({
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    CRITICAL: 'Nghiêm trọng'
  }[priority] || priority || 'Không xác định');

  const getIncidentStatus = (status) => ({
    OPEN: 'Đang mở',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết'
  }[status] || status || 'Không xác định');

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
    dashboardCancelledRef.current = false;
    dashboardFirstLoadRef.current = true;

    const fetchDashboardData = async () => {
      if (dashboardFirstLoadRef.current) {
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

        if (dashboardCancelledRef.current) return;

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
        if (dashboardFirstLoadRef.current) setActuatorLoading(false);
      } catch (error) {
        if (!dashboardCancelledRef.current) {
          console.error('Không thể đồng bộ dữ liệu nhà kính:', error.message);
          setIsOnline(false);
        }
      } finally {
        if (dashboardFirstLoadRef.current) {
          setLoadingApi(false);
          setActuatorLoading(false);
          dashboardFirstLoadRef.current = false;
        }
        if (!dashboardCancelledRef.current) {
          dashboardTimeoutRef.current = setTimeout(fetchDashboardData, 5000);
        }
      }
    };

    fetchDashboardData();
    return () => {
      dashboardCancelledRef.current = true;
      clearTimeout(dashboardTimeoutRef.current);
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Nhật ký Sự cố từ PostgreSQL</h3>
                    <p className="text-xs text-slate-400">Dữ liệu được đồng bộ tự động từ Rule Engine, cập nhật mỗi 5 giây.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="incident-zone-filter" className="text-xs text-slate-400">Lọc khu vực</label>
                    <select
                      id="incident-zone-filter"
                      value={incidentZoneFilter}
                      onChange={(event) => setIncidentZoneFilter(event.target.value)}
                      className="bg-slate-800 border border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-200"
                    >
                      <option value="">Tất cả khu vực</option>
                      {zoneIds.map((zoneId) => (
                        <option key={zoneId} value={zoneId}>{zonesData[zoneId]?.name || zoneId}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {[
                    { key: 'OPEN', label: 'Đang mở', style: 'text-rose-300' },
                    { key: 'IN_PROGRESS', label: 'Đang xử lý', style: 'text-amber-300' },
                    { key: 'RESOLVED', label: 'Đã giải quyết', style: 'text-emerald-300' },
                    { key: 'TOTAL', label: 'Tổng sự cố', style: 'text-slate-100' }
                  ].map((item) => (
                    <div key={item.key} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${item.style}`}>
                        {item.key === 'TOTAL' ? incidents.length : incidents.filter((incident) => incident.status === item.key).length}
                      </p>
                    </div>
                  ))}
                </div>

                {incidentError && (
                  <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {incidentError} Dữ liệu đang hiển thị có thể chưa phải bản cập nhật mới nhất.
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-400">{incidentLoading ? 'Đang tải dữ liệu...' : `${incidents.length} sự cố được tìm thấy`}</p>
                  <span className="text-[10px] text-slate-500">Tối đa 100 bản ghi mới nhất</span>
                </div>

                <div className="space-y-4">
                  {incidents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      {incidentLoading ? 'Đang tải nhật ký sự cố...' : 'Không có sự cố nào được ghi nhận trong bộ lọc này.'}
                    </div>
                  ) : (
                    incidents.map((incident) => {
                      const priorityStyle = incident.priority === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : incident.priority === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : incident.priority === 'MEDIUM'
                            ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                            : 'bg-slate-700/60 text-slate-300 border-slate-600';
                      const statusStyle = incident.status === 'RESOLVED'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : incident.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300';

                      return (
                        <div key={incident.id} className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className={`p-3 rounded-xl mt-0.5 border ${priorityStyle}`}>
                              {incident.priority === 'CRITICAL' ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${priorityStyle}`}>{getIncidentPriority(incident.priority)}</span>
                                <h4 className="text-sm font-bold text-white">{incident.description}</h4>
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">[{incident.zone_code || 'Không rõ khu vực'}]</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2">Mã sự cố: #{incident.id}</p>
                              {incident.image_url && <a href={incident.image_url} target="_blank" rel="noreferrer" className="text-xs text-sky-400 mt-2 inline-block">Xem hình ảnh đính kèm</a>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:flex-col md:items-end gap-2 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 shrink-0">
                            <span className="text-slate-400">{formatIncidentDate(incident.created_at)}</span>
                            <span className={`font-bold px-2 py-1 rounded-full text-[10px] ${statusStyle}`}>{getIncidentStatus(incident.status)}</span>
                          </div>
                        </div>
                      );
                    })
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
