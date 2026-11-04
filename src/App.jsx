import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplet, 
  Sun, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Power, 
  ShieldAlert, 
  Layers, 
  Wifi,
  WifiOff,
  Cpu,
  Sliders,
  AlertOctagon,
  CheckCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedZone, setSelectedZone] = useState('ZONE-01');
  const [isOnline, setIsOnline] = useState(true);
  const [waterTankLevel, setWaterTankLevel] = useState(12.0); // Cố tình để dưới 15% để test lỗi ERR_WATER_TANK_DEPLETED
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  // Trạng thái cảm biến real-time theo Zone
  const [zonesData, setZonesData] = useState({
    'ZONE-01': {
      name: 'Khu 1 - Dâu Hana (Nhật Bản)',
      status: 'OPTIMAL',
      temp: 23.5,
      airHumid: 68.2,
      soilHumid: 64.5,
      light: 24500,
      ec: 1.42,
      ph: 6.05
    },
    'ZONE-02': {
      name: 'Khu 2 - Dâu Tochiotome',
      status: 'WARNING',
      temp: 29.2,
      airHumid: 52.0,
      soilHumid: 55.0,
      light: 31000,
      ec: 1.85,
      ph: 5.40
    },
    'ZONE-03': {
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

  // Trạng thái thiết bị chấp hành (Actuators)
  const [actuators, setActuators] = useState({
    pump: { name: 'Bơm tưới nhỏ giọt', status: false, mode: 'AUTO', pin: 'GPIO 25' },
    fan: { name: 'Quạt thông gió đối lưu', status: true, mode: 'AUTO', pin: 'GPIO 26' },
    shade: { name: 'Lưới che nắng tự động', status: true, mode: 'AUTO', pin: 'GPIO 27' },
    heater: { name: 'Đèn sưởi sương mù', status: false, mode: 'AUTO', pin: 'GPIO 14' },
    nutrients: { name: 'Van châm phân tự động (EC/pH)', status: false, mode: 'AUTO', pin: 'GPIO 32' }
  });

  // Nhật ký sự cố và mã lỗi chi tiết (Incidents & Error Logs)
  const [incidents, setIncidents] = useState([
    { id: 1, code: 'ERR_WATER_TANK_DEPLETED', title: 'Mức nước bồn chứa thấp nguy hiểm', zone: 'Hệ thống chung', time: '5 phút trước', severity: 'CRITICAL', status: 'Active', message: 'Mức nước hiện tại 12.0% (< 15%). Rơ-le bơm tưới đã bị khóa tự động để bảo vệ phần cứng.' },
    { id: 2, code: 'ERR_HIGH_TEMP_WARNING', title: 'Cảnh báo nhiệt độ vượt ngưỡng', zone: 'Khu 2', time: '25 phút trước', severity: 'WARNING', message: 'Nhiệt độ Khu 2 đạt 29.2°C. Quạt thông gió đã được kích hoạt tăng cường công suất.' },
    { id: 3, code: 'INFO_CYCLE_COMPLETE', title: 'Hoàn thành chu kỳ tưới dinh dưỡng', zone: 'Khu 1', time: '1 giờ trước', message: 'Hệ thống đã tự động cấp nước và dung dịch EC 1.4 mS/cm trong 10 phút.' },
    { id: 4, code: 'ERR_SENSOR_TIMEOUT', title: 'Mất kết nối tạm thời cảm biến pH', zone: 'Khu 3', time: '3 giờ trước', message: 'Cảm biến phản hồi chậm > 3000ms. Đã tự động khởi động lại giao thức I2C thành công.' }
  ]);

  // Giả lập cập nhật dữ liệu real-time mỗi 5 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setZonesData(prev => ({
        ...prev,
        'ZONE-01': {
          ...prev['ZONE-01'],
          temp: +(23 + Math.random()).toFixed(1),
          soilHumid: +(64 + Math.random() * 2).toFixed(1)
        }
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý bật/tắt thiết bị thủ công (Manual Override) kèm kiểm tra mã lỗi nghiệp vụ
  const handleToggleActuator = (key) => {
    if (key === 'pump' && !actuators.pump.status && waterTankLevel < 15.0) {
      alert('LỖI NGHỆP VỤ [ERR_WATER_TANK_DEPLETED]: Mức nước bồn chứa dưới 15%. Không thể kích hoạt bơm tưới!');
      return;
    }

    setActuators(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: !prev[key].status,
        mode: 'MANUAL'
      }
    }));
    setIsOverrideActive(true);
  };

  const currentZone = zonesData[selectedZone];

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
              <span className="text-xs font-medium text-slate-300">MQTT Broker</span>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Connected</span>
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
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Live MQTT Stream</span>
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
                      <p className="text-xs text-slate-400">Nhấn vào công tắc để chuyển sang chế độ Manual Override.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(actuators).slice(0, 4).map((key) => {
                      const act = actuators[key];
                      return (
                        <div key={key} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-slate-200">{act.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${act.status ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                {act.status ? 'Đang chạy' : 'Đã tắt'}
                              </span>
                              <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-md">{act.mode}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleToggleActuator(key)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition ${act.status ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                          >
                            <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                          </button>
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
                        <span className="font-bold text-rose-400">{waterTankLevel}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${waterTankLevel}%` }}></div>
                      </div>
                      {waterTankLevel < 15 && (
                        <p className="text-xs text-rose-400 mt-2 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>ERR_WATER_TANK_DEPLETED: Đã khóa bơm!</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Trạng thái Failsafe: ACTIVE</h4>
                        <p className="text-xs text-slate-300 mt-1">Hệ thống ngắt rơ-le bơm tự động do mực nước dưới ngưỡng an toàn.</p>
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
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold text-white mb-2">Bản đồ Phân vùng Nhà kính (Greenhouse Zones Topology)</h3>
                <p className="text-xs text-slate-400 mb-6">Hệ thống nhà kính được chia thành 3 khu vực độc lập phục vụ các giống dâu tây công nghệ cao khác nhau.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(zonesData).map((zoneKey) => {
                    const zone = zonesData[zoneKey];
                    const isSelected = selectedZone === zoneKey;
                    return (
                      <div 
                        key={zoneKey} 
                        onClick={() => setSelectedZone(zoneKey)}
                        className={`border rounded-2xl p-6 cursor-pointer transition relative overflow-hidden ${isSelected ? 'bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">{zoneKey}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${zone.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {zone.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-white mb-4">{zone.name}</h4>
                        
                        <div className="space-y-2 text-xs text-slate-300">
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Nhiệt độ không khí:</span>
                            <span className="font-semibold text-white">{zone.temp}°C</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Độ ẩm không khí:</span>
                            <span className="font-semibold text-white">{zone.airHumid}%</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Độ ẩm đất:</span>
                            <span className="font-semibold text-white">{zone.soilHumid}%</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Cường độ sáng:</span>
                            <span className="font-semibold text-white">{zone.light} Lux</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Độ dẫn điện EC:</span>
                            <span className="font-semibold text-white">{zone.ec} mS/cm</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Độ pH dinh dưỡng:</span>
                            <span className="font-semibold text-white">{zone.ph}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-3 border-t border-emerald-500/30 text-center text-xs text-emerald-400 font-medium">
                            ✓ Đang chọn theo dõi ở Dashboard chính
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: ACTUATORS CONTROL ================= */}
          {activeTab === 'actuators' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Quản lý Thiết bị Chấp hành (Actuators Panel)</h3>
                    <p className="text-xs text-slate-400">Điều khiển rơ-le phần cứng trực tiếp qua giao thức MQTT / WebSocket.</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2">
                    <Sliders className="w-4 h-4" />
                    <span>Chế độ: Hybrid (Auto + Manual Override)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(actuators).map((key) => {
                    const act = actuators[key];
                    return (
                      <div key={key} className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{act.pin}</span>
                            <h4 className="font-bold text-sm text-white">{act.name}</h4>
                          </div>
                          <p className="text-xs text-slate-400">Trạng thái: <span className={act.status ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{act.status ? 'ON (Đang hoạt động)' : 'OFF (Đã ngắt)'}</span></p>
                          <p className="text-xs text-slate-400">Quyền điều khiển: <span className="text-amber-400 font-medium">{act.mode}</span></p>
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                          <button 
                            onClick={() => handleToggleActuator(key)}
                            className={`w-14 h-7 flex items-center rounded-full p-1 transition ${act.status ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                          >
                            <div className="bg-white w-5 h-5 rounded-full shadow-md"></div>
                          </button>
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