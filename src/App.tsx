import React, { useState, useEffect, useCallback } from 'react';
import { MONITORING_ZONES } from './data/zones';
import { ZoneWithTelemetry, EarlyWarningAlert, RiskLevel, WeatherRainfallData } from './types';
import { fetchZoneWeather, fetchLivePointWeather, SimulationScenario } from './services/openMeteo';
import { calculateZoneRisk, generateZoneAlert, calculateDistanceKm } from './utils/riskEngine';
import { TopNav } from './components/TopNav';
import { AlertBanner } from './components/AlertBanner';
import { SidebarZoneList } from './components/SidebarZoneList';
import { InteractiveMap } from './components/InteractiveMap';
import { ZoneDetailPanel } from './components/ZoneDetailPanel';
import { HowItWorksModal } from './components/HowItWorksModal';
import { SmsPushModal } from './components/SmsPushModal';
import { CheckAreaModal } from './components/CheckAreaModal';
import { AlertsDrawerModal } from './components/AlertsDrawerModal';
import { LandingPage } from './components/LandingPage';
import { Map, ListFilter, Activity, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'LANDING' | 'DASHBOARD'>('LANDING');
  const [zones, setZones] = useState<ZoneWithTelemetry[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneWithTelemetry | null>(null);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [scenario, setScenario] = useState<SimulationScenario>('LIVE');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(60);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState<boolean>(true);

  // Map Filter
  const [filterHazard, setFilterHazard] = useState<'ALL' | 'HIGH_SEVERE' | 'LANDSLIDE' | 'FLOOD'>('ALL');

  // Modals & Drawers
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  // Geolocation "Check My Area" & Exact Real-Time Weather
  const [isCheckAreaOpen, setIsCheckAreaOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userWeather, setUserWeather] = useState<WeatherRainfallData | null>(null);
  const [isLoadingUserWeather, setIsLoadingUserWeather] = useState<boolean>(false);
  const [nearestZone, setNearestZone] = useState<ZoneWithTelemetry | null>(null);
  const [distanceToNearestKm, setDistanceToNearestKm] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Mobile View Switcher (for small screens)
  const [mobileTab, setMobileTab] = useState<'MAP' | 'LIST' | 'DETAIL'>('MAP');

  // Load telemetry data for all zones
  const loadData = useCallback(async (scenarioMode: SimulationScenario = 'LIVE') => {
    setIsRefreshing(true);
    try {
      const results = await Promise.all(
        MONITORING_ZONES.map(async (zone) => {
          const weather = await fetchZoneWeather(zone, scenarioMode);
          const assessment = calculateZoneRisk(zone, weather);
          return {
            ...zone,
            weather,
            assessment,
          };
        })
      );

      // Check if at least one returned true live API
      const hasLive = results.some((r) => r.weather.isLive);
      setIsLiveApi(scenarioMode === 'LIVE' && hasLive);

      // Generate active warning alerts
      const generatedAlerts: EarlyWarningAlert[] = [];
      results.forEach((z) => {
        const alert = generateZoneAlert(z, z.assessment);
        if (alert) generatedAlerts.push(alert);
      });

      // Sort zones by composite risk
      results.sort((a, b) => b.assessment.compositeScore - a.assessment.compositeScore);

      setZones(results);
      setAlerts(generatedAlerts);
      setLastSyncTime(new Date().toLocaleTimeString());
      setCountdownSeconds(60);

      // Update selected zone if already chosen, or pick highest risk
      setSelectedZone((prev) => {
        if (!prev) return results[0] || null;
        const matching = results.find((r) => r.id === prev.id);
        return matching || results[0] || null;
      });
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(scenario);
  }, [loadData, scenario]);

  // Real-time automatic polling timer (every 60s for live data)
  useEffect(() => {
    if (scenario !== 'LIVE' || !isAutoRefreshActive) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          loadData('LIVE');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scenario, isAutoRefreshActive, loadData]);

  // Handle Scenario Change
  const handleScenarioChange = (newScenario: SimulationScenario) => {
    setScenario(newScenario);
    loadData(newScenario);
  };

  // Handle Geolocation "Check My Area"
  const handleCheckMyArea = () => {
    setGeoError(null);
    setIsLocating(true);

    if (!navigator.geolocation) {
      const fallback = zones[0] || MONITORING_ZONES[0];
      setNearestZone(fallback);
      setDistanceToNearestKm(12.4);
      setUserCoords({ lat: fallback.center[0] + 0.02, lng: fallback.center[1] + 0.02 });
      setGeoError('Geolocation is not supported by your browser environment. Displaying nearest regional sector.');
      setIsLocating(false);
      setIsCheckAreaOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const rawLat = position?.coords?.latitude;
        const rawLng = position?.coords?.longitude;
        const lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat));
        const lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng));

        if (
          isNaN(lat) ||
          isNaN(lng) ||
          !isFinite(lat) ||
          !isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          const fallback = zones[0] || MONITORING_ZONES[0];
          setNearestZone(fallback);
          setDistanceToNearestKm(12.4);
          setUserCoords({ lat: fallback.center[0] + 0.02, lng: fallback.center[1] + 0.02 });
          setGeoError('GPS signal lacked valid numerical coordinates. Showing proximity to active sector.');
          setIsLocating(false);
          setIsCheckAreaOpen(true);
          return;
        }

        setUserCoords({ lat, lng });

        // Find nearest zone
        let minDistance = Infinity;
        let closest: ZoneWithTelemetry | null = null;

        zones.forEach((z) => {
          if (Array.isArray(z.center) && typeof z.center[0] === 'number') {
            const dist = calculateDistanceKm(lat, lng, z.center[0], z.center[1]);
            if (dist < minDistance) {
              minDistance = dist;
              closest = z;
            }
          }
        });

        const activeNearest = closest || zones[0] || null;
        setNearestZone(activeNearest);
        setDistanceToNearestKm(minDistance === Infinity ? 12.4 : minDistance);
        setIsLocating(false);
        setIsCheckAreaOpen(true);

        // Fetch real-time weather at user's exact detected GPS coordinates
        setIsLoadingUserWeather(true);
        fetchLivePointWeather(lat, lng, 'User Location')
          .then((weather) => setUserWeather(weather))
          .catch((err) => console.warn('Could not fetch user exact live weather:', err))
          .finally(() => setIsLoadingUserWeather(false));

        // Auto select on map
        if (activeNearest) {
          setSelectedZone(activeNearest);
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        // Provide friendly fallback using the first zone
        const fallback = zones[0] || MONITORING_ZONES[0];
        if (fallback && Array.isArray(fallback.center) && typeof fallback.center[0] === 'number') {
          setNearestZone(fallback);
          setDistanceToNearestKm(12.4);
          setUserCoords({ lat: fallback.center[0] + 0.02, lng: fallback.center[1] + 0.02 });
          setSelectedZone(fallback);

          // Fetch real-time weather for fallback coordinates
          setIsLoadingUserWeather(true);
          fetchLivePointWeather(fallback.center[0] + 0.02, fallback.center[1] + 0.02, 'Regional Station')
            .then((weather) => setUserWeather(weather))
            .catch(() => {})
            .finally(() => setIsLoadingUserWeather(false));
        } else {
          setUserCoords(null);
        }
        setGeoError(
          'Location access was not granted or timed out. Showing proximity analysis relative to the nearest active monitoring sector.'
        );
        setIsLocating(false);
        setIsCheckAreaOpen(true);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const handleSelectZoneById = (zoneId: string) => {
    const found = zones.find((z) => z.id === zoneId);
    if (found) {
      setSelectedZone(found);
      setMobileTab('DETAIL');
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return (
    <div className="flex flex-col h-screen max-h-screen w-full overflow-hidden bg-stone-50 text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-950">
      {/* Top Header */}
      <TopNav
        currentView={currentView}
        onViewChange={setCurrentView}
        alertCount={alerts.length}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        onCheckMyArea={handleCheckMyArea}
        isLocating={isLocating}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenSmsSimulator={() => setIsSmsOpen(true)}
        simulationScenario={scenario}
        onScenarioChange={handleScenarioChange}
        onRefreshData={() => loadData(scenario)}
        isRefreshing={isRefreshing}
        isLiveApi={isLiveApi}
        lastSyncTime={lastSyncTime}
        countdownSeconds={countdownSeconds}
        isAutoRefreshActive={isAutoRefreshActive}
        onToggleAutoRefresh={() => setIsAutoRefreshActive((prev) => !prev)}
      />

      {currentView === 'LANDING' ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <LandingPage
            zones={zones}
            alerts={alerts}
            onLaunchConsole={() => setCurrentView('DASHBOARD')}
            onSelectZone={(zone) => {
              setSelectedZone(zone);
              setCurrentView('DASHBOARD');
              setMobileTab('DETAIL');
            }}
            onCheckMyArea={handleCheckMyArea}
            onOpenSmsSimulator={() => setIsSmsOpen(true)}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
            isLiveApi={isLiveApi}
            lastSyncTime={lastSyncTime}
          />
        </div>
      ) : (
        <>
          {/* Threshold Violations Alert Banner */}
          <AlertBanner
            alerts={alerts}
            onSelectZoneById={handleSelectZoneById}
            onOpenSmsSimulator={() => setIsSmsOpen(true)}
          />

          {/* Main Content Area */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mb-3" />
              <h2 className="text-base font-bold text-stone-900">
                Initializing Hydrological Telemetry...
              </h2>
              <p className="text-xs text-stone-700 mt-1 max-w-sm">
                Fetching live rainfall matrices from Open-Meteo across watershed observation stations and evaluating slope shear indices.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex items-center justify-around border-b border-stone-200/80 bg-white/80 backdrop-blur-md px-2 py-2 text-xs font-semibold text-stone-700 shadow-2xs">
            <button
              onClick={() => setMobileTab('MAP')}
              className={`tactile-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                mobileTab === 'MAP'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-orange-500" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setMobileTab('LIST')}
              className={`tactile-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                mobileTab === 'LIST'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-orange-500" />
              <span>Sectors ({zones.length})</span>
            </button>
            <button
              onClick={() => setMobileTab('DETAIL')}
              className={`tactile-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                mobileTab === 'DETAIL'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-orange-500" />
              <span>Sector Analysis</span>
            </button>
          </div>

          {/* Desktop 3-Column Layout / Mobile Single Tab */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative min-h-0">
            {/* Left Column: Sectors List */}
            <div
              className={`h-full ${
                mobileTab === 'LIST' ? 'flex flex-1 w-full min-h-0' : 'hidden lg:flex min-h-0'
              }`}
            >
              <SidebarZoneList
                zones={zones}
                selectedZone={selectedZone}
                onSelectZone={(z) => {
                  setSelectedZone(z);
                  setMobileTab('DETAIL');
                }}
              />
            </div>

            {/* Center Column: Interactive Hero Map */}
            <main
              className={`h-full flex-1 relative min-h-0 ${
                mobileTab === 'MAP' ? 'flex flex-1 w-full min-h-[400px]' : 'hidden lg:flex'
              }`}
            >
              <InteractiveMap
                zones={zones}
                selectedZone={selectedZone}
                onSelectZone={(z) => {
                  setSelectedZone(z);
                  setMobileTab('DETAIL');
                }}
                userLocation={userCoords}
                filterHazard={filterHazard}
                onFilterChange={setFilterHazard}
              />
            </main>

            {/* Right Column: Selected Sector Deep Telemetry & Recharts */}
            <div
              className={`h-full ${
                mobileTab === 'DETAIL' ? 'flex flex-1 w-full' : 'hidden lg:flex'
              }`}
            >
              {selectedZone ? (
                <ZoneDetailPanel
                  zone={selectedZone}
                  onClose={() => setSelectedZone(null)}
                  onOpenSmsSimulator={() => setIsSmsOpen(true)}
                  onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
                />
              ) : (
                <div className="w-80 xl:w-96 bg-stone-50/80 backdrop-blur-md border-l border-stone-200/80 p-8 flex flex-col items-center justify-center text-stone-500 text-xs text-center font-medium gap-2">
                  <div className="w-10 h-10 rounded-2xl glass-card border border-stone-200/80 flex items-center justify-center text-stone-400 shadow-2xs">
                    <Activity className="w-5 h-5" />
                  </div>
                  <p className="max-w-[200px]">
                    Select a watershed on the map or from the sector directory to inspect live telemetry.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )}

  {/* Modals & Dialogs */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <SmsPushModal
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        zones={zones}
        selectedZone={selectedZone}
      />

      <CheckAreaModal
        isOpen={isCheckAreaOpen}
        onClose={() => setIsCheckAreaOpen(false)}
        userCoords={userCoords}
        nearestZone={nearestZone}
        distanceKm={distanceToNearestKm}
        userWeather={userWeather}
        isLoadingWeather={isLoadingUserWeather}
        onFocusZone={(z) => {
          setSelectedZone(z);
          setMobileTab('MAP');
        }}
        errorMsg={geoError}
        onRetry={handleCheckMyArea}
      />

      <AlertsDrawerModal
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onSelectZoneById={handleSelectZoneById}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      />
    </div>
  );
}
