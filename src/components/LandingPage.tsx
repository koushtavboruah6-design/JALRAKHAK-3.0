import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Radio,
  ArrowRight,
  Calculator,
  CloudRain,
  Mountain,
  Waves,
  Activity,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Flame,
  Clock,
  Compass,
} from 'lucide-react';
import { ZoneWithTelemetry, EarlyWarningAlert } from '../types';

interface LandingPageProps {
  zones: ZoneWithTelemetry[];
  alerts: EarlyWarningAlert[];
  onLaunchConsole: () => void;
  onSelectZone: (zone: ZoneWithTelemetry) => void;
  onCheckMyArea: () => void;
  onOpenSmsSimulator: () => void;
  onOpenHowItWorks: () => void;
  onOpenAlerts: () => void;
  isLiveApi: boolean;
  lastSyncTime: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  zones,
  alerts,
  onLaunchConsole,
  onSelectZone,
  onCheckMyArea,
  onOpenSmsSimulator,
  onOpenHowItWorks,
  onOpenAlerts,
  isLiveApi,
  lastSyncTime,
}) => {
  // Compute summary stats from live data
  const highRiskCount = zones.filter((z) => {
    const lvl = z.assessment?.overallLevel?.toUpperCase();
    return lvl === 'HIGH' || lvl === 'SEVERE';
  }).length;

  const maxRainfall = zones.length
    ? Math.max(...zones.map((z) => z.weather?.currentRateMmPerHour ?? 0))
    : 0;

  const highestRiskZone = zones.length
    ? [...zones].sort(
      (a, b) => (b.assessment?.compositeScore ?? 0) - (a.assessment?.compositeScore ?? 0)
    )[0]
    : null;

  return (
    <div id="jalrakshak-landing-page" className="min-h-full flex flex-col bg-stone-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/80">
        {/* Subtle decorative background gradient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-100/40 via-amber-50/20 to-transparent pointer-events-none -z-10 blur-3xl" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Live System Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-stone-200/80 shadow-2xs text-xs font-semibold text-stone-700 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-stone-900 font-bold">Assam Basin Live Telemetry</span>
            <span className="text-stone-400">&bull;</span>
            <span className="text-stone-600 font-medium">
              {isLiveApi ? 'Open-Meteo Radar Connected' : 'Simulated Telemetry'}
            </span>
            {lastSyncTime && (
              <span className="hidden sm:inline text-stone-400 font-mono text-[11px]">
                ({lastSyncTime})
              </span>
            )}
          </div>

          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-950 leading-[1.15]">
              Hyperlocal Hydrological Defense &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700">
                Early Warning System
              </span>
            </h1>

          </div>

          {/* Primary Call-to-Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onLaunchConsole}
              className="tactile-btn flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-sm shadow-md shadow-stone-900/20 transition cursor-pointer"
            >
              <span>Launch Live Operations Console</span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
            </button>

            <button
              onClick={onCheckMyArea}
              className="tactile-btn flex items-center gap-2 px-5 py-3 glass-card hover:bg-white text-stone-800 rounded-xl font-bold text-sm shadow-2xs border border-stone-200/80 transition cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>Scan My Location</span>
            </button>

            <button
              onClick={onOpenHowItWorks}
              className="tactile-btn flex items-center gap-1.5 px-4 py-3 glass-card hover:bg-white text-stone-700 rounded-xl font-semibold text-xs shadow-2xs border border-stone-200/80 transition cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-stone-500" />
              <span>Risk Equations</span>
            </button>
          </div>

          {/* Key Live Telemetry Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto text-left">
            <div className="glass-card p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Monitored Zones</span>
                <Compass className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <div className="text-2xl font-black text-stone-900 font-mono">
                {zones.length || 8}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">High-vulnerability sectors</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Alerts</span>
                <Flame className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-orange-600 font-mono">
                {alerts.length}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {highRiskCount} in High / Severe tier
              </p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Peak Rainfall Rate</span>
                <CloudRain className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-stone-900 font-mono">
                {maxRainfall.toFixed(1)} <span className="text-xs font-bold text-stone-500">mm/h</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Live atmospheric ingestion</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Primary Hazard Sector</span>
                <Activity className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="text-sm font-bold text-stone-900 truncate">
                {highestRiskZone ? highestRiskZone.name : 'Guwahati Urban'}
              </div>
              <p className="text-[11px] text-orange-700 font-semibold mt-0.5">
                {highestRiskZone ? `${highestRiskZone.assessment.compositeScore}/100 Risk Score` : 'Nominal'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Sector Pulse / Interactive Snapshot */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Real-Time Regional Monitoring</span>
            </div>
            <h2 className="text-2xl font-black text-stone-950 mt-1">
              Active Watershed Observation Grid
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Click any sector to focus radar telemetry, elevation profiles, and 24-hour rainfall curves in the Operations Console.
            </p>
          </div>

          <button
            onClick={onLaunchConsole}
            className="tactile-btn self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 glass-pill text-xs font-bold text-stone-900 hover:text-orange-700 transition cursor-pointer"
          >
            <span>Open Interactive GIS Map</span>
            <ChevronRight className="w-3.5 h-3.5 text-orange-600" />
          </button>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {zones.slice(0, 8).map((zone) => {
            const lvl = zone.assessment?.overallLevel?.toUpperCase();
            const isHigh = lvl === 'HIGH' || lvl === 'SEVERE';

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone)}
                className="glass-card p-4 rounded-2xl border border-stone-200/80 hover:border-orange-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 truncate max-w-[140px]">
                      {zone.region || 'Assam Basin'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isHigh
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-amber-100 text-amber-900'
                        }`}
                    >
                      {zone.assessment?.overallLevel || 'Low'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-orange-700 transition line-clamp-1">
                    {zone.name}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Composite Risk</span>
                      <span className="font-mono font-bold text-stone-900">
                        {zone.assessment?.compositeScore ?? 0}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span>Precipitation Rate</span>
                      <span className="font-mono font-bold text-stone-900">
                        {(zone.weather?.currentRateMmPerHour ?? 0).toFixed(1)} mm/h
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-600">
                      <span>Terrain Slope</span>
                      <span className="font-mono font-bold text-stone-900">
                        {zone.slope ?? 0}°
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 group-hover:text-orange-600 font-semibold">
                  <span>Inspect Radar &amp; Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-stone-200/80 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
              Engineering Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-950">
              Coupling Atmospheric Feeds with Geomorphology
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
              JALRAKSHAK does not rely on subjective estimates. It computes physical hazard thresholds via two interconnected scientific indices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="glass-card p-6 rounded-2xl border border-stone-200/80 space-y-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700">
                <Mountain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Landslide Susceptibility Index (LSI)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Applies non-linear shear stress acceleration models factoring cumulative 72-hour antecedent rainfall, soil pore-water saturation, and critical slope angle thresholds (&gt;25°).
              </p>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-[10px] font-mono text-stone-700 font-bold border border-stone-200">
                  LSI = (3.2 &times; I + 0.42 &times; A72) &times; M_slope
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="glass-card p-6 rounded-2xl border border-stone-200/80 space-y-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                <Waves className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Flash Flood Velocity Modeling (FFI)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Evaluates alluvial floodplain buffers, river distance proximity, and low-elevation valley convergence dynamics driven by 24-hour cloudburst runoff volume.
              </p>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-[10px] font-mono text-stone-700 font-bold border border-stone-200">
                  FFI = (0.68 &times; A24 + 3.6 &times; I) &times; R_river
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="glass-card p-6 rounded-2xl border border-stone-200/80 space-y-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Cell Broadcast &amp; SMS Dissemination
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct integration with cellular warning gateways. When composite scores cross alert thresholds, automated warning packets are formatted for localized broadcast without app dependency.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenSmsSimulator}
                  className="tactile-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-orange-700 hover:text-orange-900 cursor-pointer shadow-2xs"
                >
                  <Radio className="w-3 h-3 text-orange-600" />
                  <span>Launch SMS Dispatch Simulator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Geolocation & Action Section */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-md bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-lg">
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
              Citizen Geolocation Scan
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-950">
              Are you currently located in an Assam risk zone?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Use your device&apos;s GPS to pinpoint the nearest watershed basin, inspect current rainfall at your exact coordinates, and receive tailored evacuation guidance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={onCheckMyArea}
              className="tactile-btn flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Scan My Current Coordinates</span>
            </button>

            <button
              onClick={onLaunchConsole}
              className="tactile-btn flex items-center justify-center gap-2 px-5 py-3 glass-card hover:bg-white text-stone-800 rounded-xl font-bold text-xs border border-stone-200/80 cursor-pointer"
            >
              <span>Explore All Sectors</span>
              <ArrowRight className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 border-t border-stone-200/80 bg-white/70 text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-stone-800">
            <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-2xs">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span>JALRAKSHAK Assam</span>
          </div>

          <p className="text-[11px] text-stone-500 font-medium">
            Weather telemetry provided via Open-Meteo. Hazard framework harmonized with World Meteorological Organization (WMO) guidelines.
          </p>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-600">
            <button onClick={onOpenHowItWorks} className="hover:text-stone-900 cursor-pointer">
              Model Specs
            </button>
            <button onClick={onOpenSmsSimulator} className="hover:text-stone-900 cursor-pointer">
              Cell Simulator
            </button>
            <button onClick={onLaunchConsole} className="hover:text-orange-700 cursor-pointer">
              GIS Radar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
