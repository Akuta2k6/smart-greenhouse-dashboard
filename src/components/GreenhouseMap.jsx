
import { Thermometer, Droplets, Sprout, Waves, Fan, Sun, Activity, Gauge, CloudFog, FlaskConical } from 'lucide-react';

const ZONE_IDS = [
  'ZONE-STRAWBERRY-01',
  'ZONE-STRAWBERRY-02',
  'ZONE-STRAWBERRY-03'
];

const ZONE_INFO = [
  { variety: 'Dâu Hana Nhật Bản', short: 'HANA', color: '#f472b6' },
  { variety: 'Dâu Tochiotome', short: 'TOCHIOTOME', color: '#fb923c' },
  { variety: 'Dâu Shizuka Premium', short: 'SHIZUKA', color: '#a78bfa' }
];

const getStatus = (status) => {
  if (status === 'CRITICAL') {
    return {
      label: 'Nguy hiểm',
      color: 'text-rose-400',
      dot: 'bg-rose-500',
      border: 'border-rose-500/40',
      background: 'bg-rose-500/10'
    };
  }

  if (status === 'WARNING' || status === 'HIGH') {
    return {
      label: 'Cảnh báo',
      color: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-400/40',
      background: 'bg-amber-400/10'
    };
  }

  return {
    label: 'Bình thường',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-400/30',
    background: 'bg-emerald-400/10'
  };
};

function PlantRow({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="190" height="37" rx="9" fill="#365344" stroke="#52745d" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`translate(${x + 17 + i * 22}, ${y + 18})`}>
          <path d="M0 0 C-13 -15 -15 3 0 2 C12 -15 15 3 0 2" fill="#4ade80" />
          <path d="M0 1 C-8 12 8 12 0 1" fill="#16a34a" />
          <circle cx="0" cy="5" r="3.5" fill="#fb7185" />
        </g>
      ))}
    </g>
  );
}

function ZoneCard({ zone, info, selected, onClick, index }) {
  const status = getStatus(zone?.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        selected
          ? 'border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-950/40'
          : 'border-slate-700 bg-slate-800/70 hover:border-slate-500 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-slate-400">
            GREENHOUSE ZONE 0{index + 1}
          </div>
          <h4 className="mt-1 font-bold text-white">{info.variety}</h4>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.background} ${status.color}`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-950/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Thermometer size={14} />
            Nhiệt độ
          </span>
          <strong className="text-sm text-white">{zone?.temp ?? '--'}°C</strong>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Droplets size={14} />
            Độ ẩm đất
          </span>
          <strong className="text-sm text-white">{zone?.soilHumid ?? '--'}%</strong>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-sky-400 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, Number(zone?.soilHumid) || 0))}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Activity size={13} />
          Cảm biến đang giám sát
        </span>
        <span className={selected ? 'font-semibold text-emerald-400' : 'text-slate-500'}>
          {selected ? 'Đang chọn' : 'Xem chi tiết'}
        </span>
      </div>
    </button>
  );
}

export default function GreenhouseMap({
  zonesData,
  selectedZone,
  onSelectZone,
  waterTankLevel,
  actuatorsByZone = {}
}) {
  const hasWaterLevel = waterTankLevel !== null && waterTankLevel !== undefined && Number.isFinite(Number(waterTankLevel));
  const water = hasWaterLevel ? Math.max(0, Math.min(100, Number(waterTankLevel))) : null;
  const waterColor = water === null ? 'bg-slate-600' : water <= 15 ? 'bg-rose-500' : water <= 30 ? 'bg-amber-400' : 'bg-sky-400';

  const selectedIndex = Math.max(0, ZONE_IDS.indexOf(selectedZone));
  const selectedData = zonesData[selectedZone] || zonesData[ZONE_IDS[0]];
  const selectedStatus = getStatus(selectedData?.status);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-emerald-400">
              <Sprout size={16} />
              SMART AGRICULTURE
            </div>
            <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Sơ đồ nhà kính thông minh
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Mô hình bố trí khu trồng, cảm biến và hệ thống thiết bị
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2">
            <div className="text-[10px] font-semibold tracking-wider text-slate-400">
              TỔNG SỐ KHU VỰC
            </div>
            <div className="mt-1 text-xl font-bold text-white">
              03 <span className="text-xs font-normal text-slate-400">Zones</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-slate-300">CHÚ THÍCH:</span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Bình thường
            </span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Cảnh báo
            </span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Nguy hiểm
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-600 bg-[#111e2c] p-3 sm:p-5">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }} />

            <div className="relative grid grid-cols-1 gap-3 md:grid-cols-[1fr_70px_1fr] lg:grid-cols-[1fr_90px_1fr_90px_1fr]">
              {ZONE_IDS.map((zoneId, index) => {
                const zone = zonesData[zoneId];
                const status = getStatus(zone?.status);
                const selected = selectedZone === zoneId;

                return (
                  <div key={zoneId} className="contents">
                    <button
                      type="button"
                      onClick={() => onSelectZone(zoneId)}
                      className={`relative min-w-0 rounded-2xl border-2 p-3 text-left transition-all duration-200 sm:p-4 ${
                        selected
                          ? 'border-emerald-400 bg-emerald-950/60 shadow-lg shadow-emerald-950/40'
                          : 'border-slate-600 bg-slate-800/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold tracking-widest text-slate-400">
                            ZONE 0{index + 1}
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">
                            {ZONE_INFO[index].short}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            {ZONE_INFO[index].variety}
                          </div>
                        </div>
                        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${status.dot} shadow-lg`} />
                      </div>

                      <div className="my-4 space-y-2 rounded-xl bg-slate-950/40 p-2.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Thermometer size={12} /> Nhiệt độ</span>
                          <strong className="text-xs text-white">{zone?.temp ?? '--'}°C</strong>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Droplets size={12} /> Độ ẩm đất</span>
                          <strong className="text-xs text-white">{zone?.soilHumid ?? '--'}%</strong>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-xl border border-slate-600/70 bg-slate-700/30 p-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                          <span>LUỐNG TRỒNG DÂU</span>
                          <Sprout size={13} className="text-emerald-400" />
                        </div>
                        <PlantRow x={0} y={0} />
                        <div className="flex justify-center">
                          <div className="flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-[9px] text-sky-300">
                            <Gauge size={11} /> SENSOR
                          </div>
                        </div>
                        <PlantRow x={0} y={0} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {[
                          { key: 'IRRIGATION_PUMP', label: 'PUMP', icon: Droplets },
                          { key: 'VENTILATION_FAN', label: 'FAN', icon: Fan },
                          { key: 'SHADE_NET', label: 'SHADE', icon: Sun },
                          { key: 'FOG_HEATER', label: 'FOG', icon: CloudFog },
                          { key: 'NUTRIENT_VALVE', label: 'NUTRIENT', icon: FlaskConical }
                        ].map((device) => {
                          const Icon = device.icon;
                          const actuator = actuatorsByZone[zoneId]?.[device.key];
                          const unknown = !actuator || actuator.status === 'UNKNOWN';
                          const faulty = actuator && actuator.deviceStatus !== 'ACTIVE';
                          const active = actuator?.status === 'ON' || actuator?.status === 'OPEN';
                          const color = faulty ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : unknown ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-700/40 text-slate-300';
                          const label = faulty ? 'ERROR' : unknown ? 'UNKNOWN' : actuator.status;
                          return (
                            <div key={device.key} className={`min-w-0 rounded-lg border px-1.5 py-2 text-center ${color}`}>
                              <Icon size={14} className="mx-auto" />
                              <span className="mt-1 block text-[9px] font-semibold">{device.label}</span>
                              <span className="block truncate text-[8px] opacity-80">{label}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className={`mt-3 rounded-lg px-2 py-2 text-center text-[10px] font-bold ${status.background} ${status.color}`}>
                        {status.label.toUpperCase()}
                      </div>
                    </button>

                    {index < 2 && (
                      <div className="hidden items-center justify-center lg:flex">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <div className="h-px w-full bg-slate-600" />
                          <span className="text-[9px] font-semibold tracking-wider">LỐI ĐI</span>
                          <div className="h-px w-full bg-slate-600" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/20 bg-sky-950/30 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-400/15 p-3 text-sky-300">
                  <Waves size={23} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">BỒN NƯỚC TRUNG TÂM</div>
                  <div className="mt-1 text-[10px] text-slate-400">Nguồn cấp nước cho hệ thống tưới</div>
                </div>
              </div>

              <div className="min-w-[180px] flex-1 sm:max-w-md">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-400">Dung lượng hiện tại</span>
                  <strong className={water === null ? 'text-slate-400' : water <= 15 ? 'text-rose-400' : water <= 30 ? 'text-amber-400' : 'text-sky-300'}>
                    {water === null ? '--' : `${water.toFixed(1)}%`}
                  </strong>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                  <div className={`h-full rounded-full transition-all duration-700 ${waterColor}`} style={{ width: `${water ?? 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ZONE_INFO.map((info, index) => {
              const zone = zonesData[ZONE_IDS[index]];
              const status = getStatus(zone?.status);

              return (
                <ZoneCard
                  key={ZONE_IDS[index]}
                  zone={zone}
                  info={info}
                  index={index}
                  selected={selectedZone === ZONE_IDS[index]}
                  onClick={() => onSelectZone(ZONE_IDS[index])}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-400">ZONE DETAILS</div>
            <h3 className="mt-1 text-lg font-bold text-white">
              Thông tin khu vực đang chọn
            </h3>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedStatus.background} ${selectedStatus.color}`}>
            {selectedStatus.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Nhiệt độ', value: `${selectedData?.temp ?? '--'}°C`, icon: Thermometer },
            { label: 'Độ ẩm không khí', value: `${selectedData?.airHumid ?? '--'}%`, icon: Droplets },
            { label: 'Độ ẩm đất', value: `${selectedData?.soilHumid ?? '--'}%`, icon: Sprout },
            { label: 'Ánh sáng', value: `${selectedData?.light ?? '--'} lux`, icon: Sun }
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Icon size={15} />
                  {item.label}
                </div>
                <div className="mt-2 text-xl font-bold text-white">{item.value}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
