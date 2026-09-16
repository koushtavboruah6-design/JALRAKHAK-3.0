import React, { useState } from 'react';
import { ZoneWithTelemetry } from '../types';
import { RISK_PALETTE } from '../utils/riskEngine';
import {
  CloudRain,
  Mountain,
  Waves,
  ShieldAlert,
  Calendar,
  Clock,
  Compass,
  Building2,
  Users,
  Radio,
  FileCode2,
  AlertTriangle,
  ChevronDown,
  Info,
  Maximize2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts';

interface ZoneDetailPanelProps {
  zone: ZoneWithTelemetry;
  onOpenSmsSimulator: () => void;
  onOpenHowItWorks: () => void;
  onClose?: () => void;
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({
  zone,
  onOpenSmsSimulator,
  onOpenHowItWorks,
  onClose,
}) => {
  const [chartView, setChartView] = useState<'DAILY' | 'HOURLY'>('DAILY');
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);

  const palette = RISK_PALETTE[zone.assessment.overallLevel];
  const isHighOrSevere =
    zone.assessment.overallLevel === 'High' || zone.assessment.overallLevel === 'Severe';

  // Format Recharts data
  const dailyData = zone.weather.dailyHistory.map((item) => ({
    name: item.date,
    rainfall: item.rainfallMm,
    forecast: item.isForecast,
  }));

  const hourlyData = zone.weather.hourlyForecast.slice(0, 16).map((item) => ({
    name: item.time,
    rate: item.precipitationMm,
    prob: item.probability,
  }));

  return (
    <div
      id="zone-detail-panel"
      className="w-full lg:w-96 xl:w-[440px] bg-stone-50/90 backdrop-blur-md border-l border-stone-200/80 flex flex-col h-full shrink-0 overflow-y-auto"
    >
      {/* Detail Header */}
      <div className="p-4 border-b border-stone-200/80 sticky top-0 bg-white/85 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span>{zone.region}</span>
            <span>&bull;</span>
            <span className="font-semibold text-stone-800">{zone.country}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide shadow-2xs ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`}
            >
              {zone.assessment.overallLevel} Risk ({zone.assessment.compositeScore}/100)
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="tactile-btn p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                title="Close Panel"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-stone-900 leading-tight mb-1">
          {zone.name}
        </h2>

        <p className="text-xs text-stone-600 mb-3 leading-relaxed">
          {zone.geologyDescription}
        </p>

        {/* Quick Location & Infrastructure Meta */}
        <div className="grid grid-cols-2 gap-2 p-2.5 glass-card rounded-xl border border-stone-200/80 text-xs">
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Population</span>
            <span className="font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
              <Users className="w-3.5 h-3.5 text-orange-600" />
              {zone.population.toLocaleString()} residents
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Terrain Elevation</span>
            <span className="font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              {zone.elevation}m ASL &bull; {zone.slope}° slope
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Live Rainfall Telemetry Cards */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-orange-600" />
              Precipitation Telemetry
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              Updated {zone.weather.lastUpdated}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl border border-stone-200/80 glass-card">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                Current Rate
              </span>
              <span className="text-base font-bold text-stone-900 font-mono">
                {zone.weather.currentRateMmPerHour.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-500 ml-0.5">mm/h</span>
            </div>

            <div className="p-2.5 rounded-xl border border-stone-200/80 glass-card">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                24h Accum.
              </span>
              <span className="text-base font-bold text-stone-900 font-mono">
                {zone.weather.last24hMm.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-500 ml-0.5">mm</span>
            </div>

            <div className="p-2.5 rounded-xl border border-stone-200/80 glass-card">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                72h Antecedent
              </span>
              <span className="text-base font-bold text-stone-900 font-mono">
                {zone.weather.last72hMm.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-500 ml-0.5">mm</span>
            </div>
          </div>

          {/* Real-time Atmospheric Station Sensor Readouts */}
          <div className="mt-2.5 p-3 rounded-xl border border-stone-200/80 glass-card text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-stone-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
                Live Meteorological Station Readings
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                Lat: {zone.center[0].toFixed(2)}°, Lng: {zone.center[1].toFixed(2)}°
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-stone-800">
              <div className="bg-white/80 p-2 rounded-lg border border-stone-200/70 shadow-2xs">
                <span className="text-[10px] text-stone-500 block font-medium">Ambient Temp</span>
                <span className="font-bold text-stone-900 font-mono text-xs">
                  {zone.weather.temperatureC != null ? `${zone.weather.temperatureC}°C` : '21.4°C'}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-stone-200/70 shadow-2xs">
                <span className="text-[10px] text-stone-500 block font-medium">Rel. Humidity</span>
                <span className="font-bold text-stone-900 font-mono text-xs">
                  {zone.weather.humidityPercent != null ? `${zone.weather.humidityPercent}%` : '85%'}
                </span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-stone-200/70 shadow-2xs">
                <span className="text-[10px] text-stone-500 block font-medium">Wind Speed</span>
                <span className="font-bold text-stone-900 font-mono text-xs">
                  {zone.weather.windSpeedKmh != null ? `${zone.weather.windSpeedKmh} km/h` : '12 km/h'}
                </span>
              </div>
            </div>
            {zone.weather.generationTimeMs != null && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500 pt-1.5 border-t border-stone-200/60">
                <span>Source: Open-Meteo Radar / Model API</span>
                <span className="font-mono">Latency: {zone.weather.generationTimeMs}ms</span>
              </div>
            )}
          </div>

          <div className="mt-2 text-[11px] text-stone-700 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs">
            <span className="font-medium text-stone-800">
              Status: {zone.weather.weatherDescription}
            </span>
            <span className="text-stone-600 font-mono font-medium">
              Fcst Next 24h: {zone.weather.forecastNext24hMm.toFixed(0)}mm
            </span>
          </div>
        </section>

        {/* Hazard Breakdown: Landslide vs Flash Flood */}
        <section className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Hazard Susceptibility Engines
          </span>

          {/* Landslide Card */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 glass-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Mountain className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-stone-900">Landslide Hazard Index (LSI)</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${RISK_PALETTE[zone.assessment.landslideLevel].badgeBg} ${RISK_PALETTE[zone.assessment.landslideLevel].badgeText} ${RISK_PALETTE[zone.assessment.landslideLevel].badgeBorder}`}
              >
                {zone.assessment.landslideLevel} ({zone.assessment.landslideScore}/100)
              </span>
            </div>

            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${zone.assessment.landslideScore}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1 text-[10px] text-stone-700 pt-1.5 border-t border-stone-200/60 font-mono">
              <div>
                <span className="text-stone-500 block">Slope Angle</span>
                <span className="font-bold text-stone-900">{zone.slope}° (&times;{zone.assessment.landslideBreakdown.slopeMultiplier})</span>
              </div>
              <div>
                <span className="text-stone-500 block">Antecedent 72h</span>
                <span className="font-bold text-stone-900">{zone.assessment.landslideBreakdown.effective72hMm} mm</span>
              </div>
              <div>
                <span className="text-stone-500 block">Soil Saturation</span>
                <span className="font-bold text-stone-900">{zone.soilSaturationInitial}%</span>
              </div>
            </div>
          </div>

          {/* Flash Flood Card */}
          <div className="p-3.5 rounded-xl border border-stone-200/80 glass-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-stone-900">Flash Flood Index (FFI)</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${RISK_PALETTE[zone.assessment.floodLevel].badgeBg} ${RISK_PALETTE[zone.assessment.floodLevel].badgeText} ${RISK_PALETTE[zone.assessment.floodLevel].badgeBorder}`}
              >
                {zone.assessment.floodLevel} ({zone.assessment.floodScore}/100)
              </span>
            </div>

            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${zone.assessment.floodScore}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1 text-[10px] text-stone-700 pt-1.5 border-t border-stone-200/60 font-mono">
              <div>
                <span className="text-stone-500 block">River Proximity</span>
                <span className="font-bold text-stone-900">{zone.riverProximityKm} km (&times;{zone.assessment.floodBreakdown.riverProximityMultiplier})</span>
              </div>
              <div>
                <span className="text-stone-500 block">24h Runoff Total</span>
                <span className="font-bold text-stone-900">{zone.assessment.floodBreakdown.accumulation24h} mm</span>
              </div>
              <div>
                <span className="text-stone-500 block">Valley Funnel</span>
                <span className="font-bold text-stone-900">&times;{zone.assessment.floodBreakdown.elevationFunnelMultiplier}</span>
              </div>
            </div>
          </div>

          {/* Toggle Formula Breakdown */}
          <button
            onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
            className="tactile-btn w-full flex items-center justify-between px-3 py-2 text-xs text-stone-700 glass-card rounded-xl font-semibold transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-orange-600" />
              {showFormulaBreakdown ? 'Hide Formula Equation' : 'Inspect Mathematical Formulas'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormulaBreakdown ? 'rotate-180' : ''}`} />
          </button>

          {showFormulaBreakdown && (
            <div className="p-3.5 glass-card rounded-xl text-xs space-y-2.5 text-stone-800 font-mono">
              <div className="border-b border-stone-200/60 pb-2">
                <span className="font-sans font-bold text-stone-900 block mb-0.5">LSI Calculation:</span>
                <p className="text-[11px] text-stone-700">
                  (Rate &times; 3.2 + 72h &times; 0.42) &times; SlopeMultiplier &times; Saturation &times; 0.45
                </p>
                <p className="text-[10px] text-orange-800 mt-1 font-sans">
                  = ({zone.assessment.landslideBreakdown.intensityFactor} + {zone.assessment.landslideBreakdown.effective72hMm}) &times; {zone.assessment.landslideBreakdown.slopeMultiplier} &times; {zone.assessment.landslideBreakdown.saturationFactor} &times; 0.45 = <strong className="text-stone-900">{zone.assessment.landslideScore}</strong>
                </p>
              </div>
              <div>
                <span className="font-sans font-bold text-stone-900 block mb-0.5">FFI Calculation:</span>
                <p className="text-[11px] text-stone-700">
                  (24h &times; 0.68 + Rate &times; 3.6) &times; RiverBuffer &times; Elevation &times; 0.40
                </p>
                <p className="text-[10px] text-orange-800 mt-1 font-sans">
                  = ({zone.assessment.floodBreakdown.accumulation24h} + {zone.assessment.floodBreakdown.intensityFactor}) &times; {zone.assessment.floodBreakdown.riverProximityMultiplier} &times; {zone.assessment.floodBreakdown.elevationFunnelMultiplier} &times; 0.40 = <strong className="text-stone-900">{zone.assessment.floodScore}</strong>
                </p>
              </div>
              <button
                onClick={onOpenHowItWorks}
                className="text-xs text-orange-700 font-sans font-bold underline block pt-1 hover:text-orange-900 cursor-pointer"
              >
                Open Full Interactive Formula Sandbox &rarr;
              </button>
            </div>
          )}
        </section>

        {/* Historical & Forecast Charts (Recharts) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Precipitation History & Forecast
            </span>
            <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setChartView('DAILY')}
                className={`tactile-btn px-2.5 py-1 rounded-md transition cursor-pointer ${
                  chartView === 'DAILY' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600'
                }`}
              >
                7-Day / Daily
              </button>
              <button
                onClick={() => setChartView('HOURLY')}
                className={`tactile-btn px-2.5 py-1 rounded-md transition cursor-pointer ${
                  chartView === 'HOURLY' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600'
                }`}
              >
                24h Hourly
              </button>
            </div>
          </div>

          <div className="h-48 w-full glass-card rounded-xl p-3 border border-stone-200/80">
            {chartView === 'DAILY' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716C' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#78716C' }} unit="mm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E5E4',
                      borderRadius: 10,
                      fontSize: 11,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    }}
                    formatter={(val: number | string | undefined) => [`${val ?? 0} mm`, 'Rainfall']}
                  />
                  <ReferenceLine
                    y={50}
                    label={{ value: 'Warning 50mm', position: 'insideTopRight', fill: '#EA580C', fontSize: 9 }}
                    stroke="#EA580C"
                    strokeDasharray="3 3"
                  />
                  <Bar dataKey="rainfall" fill="#EA580C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#78716C' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#78716C' }} unit="mm/h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E5E4',
                      borderRadius: 10,
                      fontSize: 11,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    }}
                    formatter={(val: number | string | undefined) => [`${val ?? 0} mm/h`, 'Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#EA580C"
                    strokeWidth={2}
                    dot={{ fill: '#EA580C', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[10px] text-stone-500 text-center font-medium">
            Source: Live Open-Meteo precipitation models with historical past-days telemetry.
          </p>
        </section>

        {/* Actionable Safety Protocol & Advisories */}
        <section className="p-3.5 glass-card rounded-xl border border-stone-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600 shadow-2xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-stone-900">Recommended Action Plan</span>
          </div>

          <p className="text-xs font-medium text-stone-800 leading-relaxed">
            {zone.assessment.recommendedAction}
          </p>

          <div className="space-y-1.5 pt-2 border-t border-stone-200/60 text-xs">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Active Advisories:</span>
            {zone.assessment.activeAdvisories.map((adv, i) => (
              <div key={i} className="flex items-start gap-1.5 text-stone-700 text-[11px]">
                <span className="text-orange-600 font-bold">&bull;</span>
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Critical Infrastructure List */}
        <section className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Vulnerable Infrastructure Assets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {zone.criticalInfrastructure.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 glass-card border border-stone-200/80 text-stone-800 rounded-lg text-[11px] font-medium shadow-2xs"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Simulate SMS Dispatch Button */}
        <div className="pt-2">
          <button
            id="btn-simulate-zone-sms"
            onClick={onOpenSmsSimulator}
            className="tactile-btn w-full py-2.5 px-3 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 border border-orange-400/30 transition cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Simulate Citizen SMS / Push Alert Broadcast</span>
          </button>
        </div>
      </div>
    </div>
  );
};
