import React, { useState, useMemo } from 'react';
import { ZoneWithTelemetry, RiskLevel } from '../types';
import { RISK_PALETTE } from '../utils/riskEngine';
import {
  Search,
  SlidersHorizontal,
  Mountain,
  Waves,
  CloudRain,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SidebarZoneListProps {
  zones: ZoneWithTelemetry[];
  selectedZone: ZoneWithTelemetry | null;
  onSelectZone: (zone: ZoneWithTelemetry) => void;
}

export const SidebarZoneList: React.FC<SidebarZoneListProps> = ({
  zones,
  selectedZone,
  onSelectZone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [hazardFocus, setHazardFocus] = useState<'ALL' | 'LANDSLIDE' | 'FLOOD'>('ALL');
  const [sortBy, setSortBy] = useState<'RISK' | 'RAINFALL' | 'SLOPE'>('RISK');

  const filteredAndSortedZones = useMemo(() => {
    return zones
      .filter((zone) => {
        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = zone.name.toLowerCase().includes(q);
          const matchRegion = zone.region.toLowerCase().includes(q);
          const matchCountry = zone.country.toLowerCase().includes(q);
          if (!matchName && !matchRegion && !matchCountry) return false;
        }

        // Severity filter
        if (severityFilter !== 'ALL' && zone.assessment.overallLevel !== severityFilter) {
          return false;
        }

        // Hazard focus
        if (hazardFocus === 'LANDSLIDE' && zone.assessment.landslideScore < 45) {
          return false;
        }
        if (hazardFocus === 'FLOOD' && zone.assessment.floodScore < 45) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'RISK') {
          return b.assessment.compositeScore - a.assessment.compositeScore;
        }
        if (sortBy === 'RAINFALL') {
          return b.weather.currentRateMmPerHour - a.weather.currentRateMmPerHour;
        }
        if (sortBy === 'SLOPE') {
          return b.slope - a.slope;
        }
        return 0;
      });
  }, [zones, searchQuery, severityFilter, hazardFocus, sortBy]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: zones.length,
      severe: zones.filter((z) => z.assessment.overallLevel === 'Severe').length,
      high: zones.filter((z) => z.assessment.overallLevel === 'High').length,
      moderate: zones.filter((z) => z.assessment.overallLevel === 'Moderate').length,
      low: zones.filter((z) => z.assessment.overallLevel === 'Low').length,
    };
  }, [zones]);

  return (
    <aside
      id="sidebar-zone-list"
      className="w-full lg:w-80 xl:w-96 bg-stone-50/90 backdrop-blur-md border-r border-stone-200/80 flex flex-col h-full shrink-0"
    >
      {/* Sidebar Header & Search */}
      <div className="p-3.5 border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Monitoring Sectors
          </span>
          <span className="text-[11px] text-stone-500 font-mono font-medium px-2 py-0.5 rounded-md bg-stone-100/80 border border-stone-200/60 shadow-2xs">
            {filteredAndSortedZones.length} of {zones.length} active
          </span>
        </div>

        {/* Search Box with tactile inset */}
        <div className="relative mb-2.5">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-zone-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search watershed, river, or region..."
            className="w-full pl-9 pr-3 py-1.5 tactile-inset bg-white/90 border border-stone-200/80 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
          />
        </div>

        {/* Severity Filter Pills in warm tint progression */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`tactile-btn px-2.5 py-1 rounded-lg font-bold border transition shrink-0 cursor-pointer ${
              severityFilter === 'ALL'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white/80 text-stone-600 border-stone-200/80 hover:bg-white hover:text-stone-900'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setSeverityFilter('Severe')}
            className={`tactile-btn px-2.5 py-1 rounded-lg font-bold border transition shrink-0 cursor-pointer ${
              severityFilter === 'Severe'
                ? 'bg-stone-900 text-orange-400 border-orange-600 shadow-xs'
                : 'bg-orange-50/80 text-orange-950 border-orange-200/80 hover:bg-orange-100'
            }`}
          >
            Severe ({counts.severe})
          </button>
          <button
            onClick={() => setSeverityFilter('High')}
            className={`tactile-btn px-2.5 py-1 rounded-lg font-bold border transition shrink-0 cursor-pointer ${
              severityFilter === 'High'
                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                : 'bg-orange-50/80 text-orange-800 border-orange-200/80 hover:bg-orange-100'
            }`}
          >
            High ({counts.high})
          </button>
          <button
            onClick={() => setSeverityFilter('Moderate')}
            className={`tactile-btn px-2.5 py-1 rounded-lg font-bold border transition shrink-0 cursor-pointer ${
              severityFilter === 'Moderate'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/80 text-amber-900 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            Mod ({counts.moderate})
          </button>
          <button
            onClick={() => setSeverityFilter('Low')}
            className={`tactile-btn px-2.5 py-1 rounded-lg font-bold border transition shrink-0 cursor-pointer ${
              severityFilter === 'Low'
                ? 'bg-amber-200 text-amber-950 border-amber-300 shadow-xs'
                : 'bg-stone-100/80 text-stone-600 border-stone-200/80 hover:bg-stone-200'
            }`}
          >
            Low ({counts.low})
          </button>
        </div>

        {/* Hazard & Sort Row */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-200/70 text-[11px] text-stone-700">
          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-medium">Focus:</span>
            <button
              onClick={() => setHazardFocus(hazardFocus === 'LANDSLIDE' ? 'ALL' : 'LANDSLIDE')}
              className={`tactile-btn px-2 py-0.5 rounded-lg flex items-center gap-1 border transition cursor-pointer ${
                hazardFocus === 'LANDSLIDE'
                  ? 'bg-stone-800 text-white border-stone-800 shadow-2xs'
                  : 'bg-white/80 border-stone-200/80 text-stone-700 hover:bg-white'
              }`}
            >
              <Mountain className="w-3 h-3 text-orange-500" />
              Slope
            </button>
            <button
              onClick={() => setHazardFocus(hazardFocus === 'FLOOD' ? 'ALL' : 'FLOOD')}
              className={`tactile-btn px-2 py-0.5 rounded-lg flex items-center gap-1 border transition cursor-pointer ${
                hazardFocus === 'FLOOD'
                  ? 'bg-stone-800 text-white border-stone-800 shadow-2xs'
                  : 'bg-white/80 border-stone-200/80 text-stone-700 hover:bg-white'
              }`}
            >
              <Waves className="w-3 h-3 text-orange-500" />
              Flood
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-stone-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'RISK' | 'RAINFALL' | 'SLOPE')}
              className="bg-white/90 border border-stone-200/80 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-2xs"
            >
              <option value="RISK">Risk Score</option>
              <option value="RAINFALL">Rainfall Rate</option>
              <option value="SLOPE">Steepness</option>
            </select>
          </div>
        </div>
      </div>

      {/* Zone Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredAndSortedZones.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-600 glass-card rounded-xl">
            No monitoring zones match your current filters.
          </div>
        ) : (
          filteredAndSortedZones.map((zone) => {
            const isSelected = selectedZone?.id === zone.id;
            const palette = RISK_PALETTE[zone.assessment.overallLevel];

            return (
              <div
                key={zone.id}
                id={`zone-card-${zone.id}`}
                onClick={() => onSelectZone(zone)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-md transform -translate-y-0.5'
                    : 'glass-card glass-card-interactive hover:bg-white'
                }`}
              >
                {/* Card Top: Region & Severity Badge */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-stone-500 truncate">
                    {zone.region}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shrink-0 shadow-2xs ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`}
                  >
                    {zone.assessment.overallLevel} ({zone.assessment.compositeScore})
                  </span>
                </div>

                {/* Card Title */}
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs font-bold text-stone-900 leading-snug truncate">
                    {zone.name}
                  </h3>
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isSelected ? 'text-orange-600' : 'text-stone-400'
                    }`}
                  />
                </div>

                {/* Key Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-stone-200/60 text-[11px]">
                  <div className="flex items-center gap-1.5 text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse shrink-0" />
                    <CloudRain className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="font-mono font-bold text-stone-900">
                      {zone.weather.currentRateMmPerHour.toFixed(1)} mm/h
                    </span>
                  </div>
                  <div className="text-right text-stone-600 font-mono text-[10px] flex items-center justify-end gap-1.5">
                    {zone.weather.temperatureC != null && (
                      <span className="text-stone-600 font-medium">{zone.weather.temperatureC}°C</span>
                    )}
                    <span>
                      24h: <span className="font-bold text-stone-900">{zone.weather.last24hMm.toFixed(0)}mm</span>
                    </span>
                  </div>
                </div>

                {/* Landslide & Flood Score Bars */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-1.5 text-[10px]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-stone-600 font-medium flex items-center gap-0.5">
                        <Mountain className="w-2.5 h-2.5 text-stone-500" />
                        Landslide
                      </span>
                      <span className="font-mono font-bold text-stone-800">
                        {zone.assessment.landslideScore}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                        style={{ width: `${zone.assessment.landslideScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-stone-600 font-medium flex items-center gap-0.5">
                        <Waves className="w-2.5 h-2.5 text-stone-500" />
                        Flood
                      </span>
                      <span className="font-mono font-bold text-stone-800">
                        {zone.assessment.floodScore}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                        style={{ width: `${zone.assessment.floodScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Terrain attributes chips */}
                <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-stone-200/50 text-[10px] text-stone-500 font-medium">
                  <span>Slope: {zone.slope}°</span>
                  <span>&bull;</span>
                  <span>River: {zone.riverProximityKm}km</span>
                  <span>&bull;</span>
                  <span>{zone.elevation}m ASL</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
