import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { ZoneWithTelemetry, RiskLevel } from '../types';
import { RISK_PALETTE } from '../utils/riskEngine';
import {
  ShieldAlert,
  Mountain,
  Waves,
  MapPin,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  Globe,
  Check,
  Eye,
  X,
  Map as MapIcon,
  Flame,
} from 'lucide-react';

export type BaseLayerType = 'light' | 'terrain' | 'satellite';

interface LayerOption {
  id: BaseLayerType;
  label: string;
  provider: string;
  description: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom: number;
}

const BASE_LAYERS: Record<BaseLayerType, LayerOption> = {
  light: {
    id: 'light',
    label: 'OpenStreetMap Light',
    provider: 'OpenStreetMap',
    description: 'Standard OpenStreetMap cartography with road network and river outlines',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  terrain: {
    id: 'terrain',
    label: 'Terrain Elevation',
    provider: 'OpenTopoMap / SRTM',
    description: 'Topographic contour elevation lines, mountain hillshades & river gorges',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>, SRTM | Style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noreferrer">OpenTopoMap</a>',
    subdomains: 'abc',
    maxZoom: 17,
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite Imagery',
    provider: 'Esri World Imagery',
    description: 'High-resolution true-color orbital imagery of riverbeds and terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a> &mdash; USGS, USDA, GeoEye, Earthstar Geographics',
    subdomains: '',
    maxZoom: 18,
  },
};

const LABELS_OVERLAY_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

interface InteractiveMapProps {
  zones: ZoneWithTelemetry[];
  selectedZone: ZoneWithTelemetry | null;
  onSelectZone: (zone: ZoneWithTelemetry) => void;
  userLocation: { lat: number; lng: number } | null;
  filterHazard: 'ALL' | 'HIGH_SEVERE' | 'LANDSLIDE' | 'FLOOD';
  onFilterChange: (filter: 'ALL' | 'HIGH_SEVERE' | 'LANDSLIDE' | 'FLOOD') => void;
}

// Coordinate safety validators to avoid Leaflet "Invalid LatLng object: (NaN, NaN)"
function isValidCoord(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return (
    isValidCoord(lat) &&
    isValidCoord(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  userLocation,
  filterHazard,
  onFilterChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const layerMenuRef = useRef<HTMLDivElement>(null);

  // Map layer toggle state
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('light');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Close layer menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target as Node)) {
        setIsLayerMenuOpen(false);
      }
    }
    if (isLayerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayerMenuOpen]);

  // Initialize Leaflet Map Base & Default Tile Layer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initializing if already active
    if (mapInstanceRef.current) return;

    // Clear any stale Leaflet id from container in React Strict Mode
    if ((mapContainerRef.current as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (mapContainerRef.current as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    // Default center on Assam State, India
    const initialCenter: [number, number] = [26.2, 92.9]; // Geographic center of Assam
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 7,
      zoomControl: false, // Custom controls rendered in UI overlay
      attributionControl: true,
      minZoom: 3,
      maxZoom: 18,
    });

    // Add initial base tile layer immediately so map is never blank
    const layerMeta = BASE_LAYERS[baseLayer];
    const initialBaseLayer = L.tileLayer(layerMeta.url, {
      attribution: layerMeta.attribution,
      subdomains: layerMeta.subdomains || 'abc',
      maxZoom: layerMeta.maxZoom,
    });
    initialBaseLayer.addTo(map);
    baseTileLayerRef.current = initialBaseLayer;

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Ensure size calculation after DOM render
    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as unknown as { _leaflet_id?: number })._leaflet_id;
      }
      baseTileLayerRef.current = null;
      labelsTileLayerRef.current = null;
    };
  }, []);

  // Synchronize Base Map and Overlay Tile Layers when user switches
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerMeta = BASE_LAYERS[baseLayer];

    // Remove previous base layer if existing
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }

    // Add newly selected base tile layer
    const newBaseLayer = L.tileLayer(layerMeta.url, {
      attribution: layerMeta.attribution,
      subdomains: layerMeta.subdomains || 'abc',
      maxZoom: layerMeta.maxZoom,
    });
    newBaseLayer.addTo(map);
    baseTileLayerRef.current = newBaseLayer;

    // Remove previous labels overlay if existing
    if (labelsTileLayerRef.current) {
      map.removeLayer(labelsTileLayerRef.current);
      labelsTileLayerRef.current = null;
    }

    // Add place and river labels overlay if enabled on satellite imagery
    if (showLabels && baseLayer === 'satellite') {
      const labelsLayer = L.tileLayer(LABELS_OVERLAY_URL, {
        attribution: 'Labels &copy; Esri',
        maxZoom: 18,
      });
      labelsLayer.addTo(map);
      labelsTileLayerRef.current = labelsLayer;
    }
  }, [baseLayer, showLabels]);

  // Synchronize Composite Risk Heatmap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous heat layer if existing
    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch (e) {
        console.warn('Could not remove previous heat layer', e);
      }
      heatLayerRef.current = null;
    }

    if (!showHeatmap) return;

    // Filter zones to match active hazard view
    const activeZones = zones.filter((z) => {
      if (filterHazard === 'HIGH_SEVERE') {
        return z.assessment.overallLevel === 'High' || z.assessment.overallLevel === 'Severe';
      }
      if (filterHazard === 'LANDSLIDE') {
        return z.assessment.landslideScore >= 50;
      }
      if (filterHazard === 'FLOOD') {
        return z.assessment.floodScore >= 50;
      }
      return true;
    });

    // Build weighted heat sampling points: [latitude, longitude, intensity 0..1]
    const heatPoints: [number, number, number][] = [];

    activeZones.forEach((zone) => {
      let score = zone.assessment.compositeScore;
      if (filterHazard === 'FLOOD') {
        score = zone.assessment.floodScore;
      } else if (filterHazard === 'LANDSLIDE') {
        score = zone.assessment.landslideScore;
      }

      // Intensity normalized from 0.15 to 1.0 based on 0-100 score
      const intensity = Math.max(0.15, Math.min(1.0, score / 100));

      // 1. Zone geographic center (peak intensity core)
      if (
        Array.isArray(zone.center) &&
        zone.center.length >= 2 &&
        isValidLatLng(zone.center[0], zone.center[1])
      ) {
        const [cLat, cLng] = zone.center;
        heatPoints.push([cLat, cLng, intensity]);
        heatPoints.push([cLat, cLng, intensity * 0.95]);

        // 2. Sample along watershed polygon vertices and interior interpolation points
        if (Array.isArray(zone.polygon)) {
          zone.polygon.forEach((pt) => {
            if (Array.isArray(pt) && pt.length >= 2 && isValidLatLng(pt[0], pt[1])) {
              const [pLat, pLng] = pt;
              // Perimeter vertex
              heatPoints.push([pLat, pLng, intensity * 0.6]);

              // Midpoint interpolation to fill catchment basin
              const midLat = (cLat + pLat) / 2;
              const midLng = (cLng + pLng) / 2;
              heatPoints.push([midLat, midLng, intensity * 0.8]);

              // Quarter point near center
              const qLat = cLat * 0.7 + pLat * 0.3;
              const qLng = cLng * 0.7 + pLng * 0.3;
              heatPoints.push([qLat, qLng, intensity * 0.9]);
            }
          });
        }
      }
    });

    if (heatPoints.length === 0) return;

    try {
      if (typeof (L as unknown as { heatLayer?: (pts: unknown[], opts: unknown) => L.HeatLayer }).heatLayer === 'function') {
        const isSatellite = baseLayer === 'satellite';
        const heat = (L as unknown as { heatLayer: (pts: unknown[], opts: unknown) => L.HeatLayer }).heatLayer(
          heatPoints,
          {
            radius: isSatellite ? 45 : 38,
            blur: isSatellite ? 35 : 26,
            maxZoom: 14,
            max: 1.0,
            minOpacity: isSatellite ? 0.45 : 0.35,
            gradient: {
              0.15: '#fef08a', // Pale amber (low risk)
              0.35: '#facc15', // Warm gold
              0.55: '#fb923c', // Orange (moderate risk)
              0.75: '#ea580c', // Dark orange (high risk)
              0.88: '#dc2626', // Deep red-orange (severe risk)
              1.00: '#7f1d1d', // Crimson / Peak hazard
            },
          }
        );

        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    } catch (err) {
      console.warn('Could not initialize Leaflet HeatLayer', err);
    }

    return () => {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch (e) {
          // ignore cleanup errors
        }
        heatLayerRef.current = null;
      }
    };
  }, [showHeatmap, zones, filterHazard, baseLayer]);

  // Update Zones & Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Filter zones based on active tab
    const filteredZones = zones.filter((z) => {
      if (filterHazard === 'HIGH_SEVERE') {
        return z.assessment.overallLevel === 'High' || z.assessment.overallLevel === 'Severe';
      }
      if (filterHazard === 'LANDSLIDE') {
        return z.assessment.landslideScore >= 50;
      }
      if (filterHazard === 'FLOOD') {
        return z.assessment.floodScore >= 50;
      }
      return true;
    });

    const isSatellite = baseLayer === 'satellite';

    filteredZones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      const palette = RISK_PALETTE[zone.assessment.overallLevel];

      // Validate and Draw Watershed Polygon
      const validPolygon = Array.isArray(zone.polygon)
        ? (zone.polygon.filter(
          (pt) => Array.isArray(pt) && pt.length >= 2 && isValidLatLng(pt[0], pt[1])
        ) as [number, number][])
        : [];

      if (validPolygon.length >= 3) {
        try {
          const polygon = L.polygon(validPolygon, {
            color: isSatellite ? (isSelected ? '#F97316' : '#FFFFFF') : palette.mapStroke,
            weight: isSelected ? 3.5 : (isSatellite ? 2.2 : 1.5),
            opacity: isSelected ? 1 : (isSatellite ? 0.95 : 0.8),
            fillColor: palette.mapFill,
            fillOpacity: isSelected
              ? 0.6
              : showHeatmap
                ? 0.12
                : isSatellite
                  ? 0.45
                  : 0.35,
            dashArray: isSelected ? undefined : '4, 4',
          });

          polygon.on('click', () => {
            onSelectZone(zone);
          });

          polygon.addTo(layerGroup);
        } catch (e) {
          console.warn('Could not render polygon for zone', zone.id, e);
        }
      }

      // Create Custom HTML Marker Beacon if center coordinates are valid
      if (
        !Array.isArray(zone.center) ||
        zone.center.length < 2 ||
        !isValidLatLng(zone.center[0], zone.center[1])
      ) {
        return;
      }

      const isSevere = zone.assessment.overallLevel === 'Severe';
      const isHigh = zone.assessment.overallLevel === 'High';
      const isWarmAlert = isHigh || isSevere;

      const markerHtml = `
        <div class="relative cursor-pointer group select-none">
          ${isWarmAlert
          ? `<div class="absolute -inset-2.5 rounded-full ${isSevere ? 'bg-orange-600/30 animate-ping' : 'bg-orange-500/20'
          }"></div>`
          : ''
        }
          <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-105 border ${isSelected
          ? 'bg-stone-900 text-white border-orange-500 ring-2 ring-orange-500/40'
          : `${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`
        }">
            <span class="w-2 h-2 rounded-full ${palette.dotColor} shrink-0"></span>
            <span class="text-xs font-semibold whitespace-nowrap">${zone.name.split('-')[0].trim()}</span>
            <span class="text-[10px] font-mono opacity-80 pl-0.5 border-l border-current/20">
              ${zone.weather.currentRateMmPerHour.toFixed(1)}mm/h
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      });

      try {
        const marker = L.marker(zone.center as [number, number], { icon: customIcon });

        // Clean HTML Popup
        const popupHtml = `
          <div class="p-3.5 max-w-[280px] font-sans text-stone-900">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[11px] font-medium tracking-wide uppercase text-stone-700">${zone.region}</span>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold border ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}">
                ${zone.assessment.overallLevel} Risk
              </span>
            </div>
            <h4 class="text-sm font-bold text-stone-900 mb-1 leading-snug">${zone.name}</h4>
            <p class="text-xs text-stone-700 mb-3">${palette.description}</p>
            
            <div class="grid grid-cols-2 gap-2 p-2 mb-3 bg-stone-50 rounded border border-stone-200 text-xs">
              <div>
                <span class="text-stone-700 block text-[10px] uppercase font-semibold">Live Rain</span>
                <span class="font-bold text-stone-900">${zone.weather.currentRateMmPerHour.toFixed(1)} mm/h</span>
              </div>
              <div>
                <span class="text-stone-700 block text-[10px] uppercase font-semibold">24h Total</span>
                <span class="font-bold text-stone-900">${zone.weather.last24hMm.toFixed(1)} mm</span>
              </div>
              <div>
                <span class="text-stone-700 block text-[10px] uppercase font-semibold">Landslide</span>
                <span class="font-bold ${zone.assessment.landslideScore >= 60 ? 'text-orange-700' : 'text-stone-800'}">
                  ${zone.assessment.landslideScore}/100
                </span>
              </div>
              <div>
                <span class="text-stone-700 block text-[10px] uppercase font-semibold">Flood</span>
                <span class="font-bold ${zone.assessment.floodScore >= 60 ? 'text-orange-700' : 'text-stone-800'}">
                  ${zone.assessment.floodScore}/100
                </span>
              </div>
            </div>

            <button id="btn-popup-${zone.id}" class="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded transition flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-orange-500 focus:outline-none">
              Inspect Full Telemetry &rarr;
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          className: 'custom-leaflet-popup',
          closeButton: true,
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-popup-${zone.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectZone(zone);
              map.closePopup();
            };
          }
        });

        marker.on('click', () => {
          onSelectZone(zone);
        });

        marker.addTo(layerGroup);
      } catch (e) {
        console.warn('Could not place marker for zone', zone.id, e);
      }
    });
  }, [zones, selectedZone, filterHazard, onSelectZone, baseLayer, showHeatmap]);

  // Pan to selected zone safely
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedZone) return;

    if (
      Array.isArray(selectedZone.center) &&
      selectedZone.center.length >= 2 &&
      isValidLatLng(selectedZone.center[0], selectedZone.center[1])
    ) {
      try {
        map.flyTo(selectedZone.center as [number, number], 11, {
          animate: true,
          duration: 1.2,
        });
      } catch (e) {
        console.warn('Map flyTo failed:', e);
      }
    }
  }, [selectedZone]);

  // Handle user geolocation marker safely
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (
      userLocation &&
      isValidLatLng(userLocation.lat, userLocation.lng)
    ) {
      try {
        const userIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute w-6 h-6 rounded-full bg-orange-600/40"></span>
              <span class="relative w-4 h-4 rounded-full bg-orange-600 border-2 border-white shadow-md"></span>
            </div>
          `,
          className: 'user-loc-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .bindPopup(
            `<div class="p-2 text-xs font-sans">
              <strong class="text-orange-700 block mb-0.5">Your Position</strong>
              <span>${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°</span>
            </div>`
          )
          .addTo(map);

        userMarkerRef.current = marker;
        map.flyTo([userLocation.lat, userLocation.lng], 10, { animate: true, duration: 1.4 });
      } catch (e) {
        console.warn('User marker placement failed:', e);
      }
    }
  }, [userLocation]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || !Array.isArray(zones) || zones.length === 0) return;

    const validCenters = zones
      .map((z) => z.center)
      .filter(
        (c) => Array.isArray(c) && c.length >= 2 && isValidLatLng(c[0], c[1])
      ) as [number, number][];

    if (validCenters.length > 0) {
      try {
        const bounds = L.latLngBounds(validCenters);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      } catch (e) {
        console.warn('Reset bounds failed:', e);
      }
    }
  };


  return (
    <div id="interactive-map-wrapper" className="relative w-full h-full min-h-[480px] flex-1 bg-stone-100 overflow-hidden">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" style={{ minHeight: '480px' }} />

      {/* Floating Map Controls & Filters */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 glass-dock border border-white/70 p-1.5 rounded-xl shadow-md text-xs">
        <span className="text-stone-700 font-bold px-2 uppercase text-[10px] tracking-wider">Layer View:</span>
        <button
          id="map-filter-all"
          onClick={() => onFilterChange('ALL')}
          className={`tactile-btn px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${filterHazard === 'ALL'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-950 hover:bg-white/80'
            }`}
        >
          All Zones ({zones.length})
        </button>
        <button
          id="map-filter-high-severe"
          onClick={() => onFilterChange('HIGH_SEVERE')}
          className={`tactile-btn px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer ${filterHazard === 'HIGH_SEVERE'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xs'
              : 'text-orange-700 hover:bg-orange-50/80'
            }`}
        >
          <ShieldAlert className="w-3 h-3" />
          High/Severe Only
        </button>
        <button
          id="map-filter-landslide"
          onClick={() => onFilterChange('LANDSLIDE')}
          className={`tactile-btn px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer ${filterHazard === 'LANDSLIDE'
              ? 'bg-stone-800 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-950 hover:bg-white/80'
            }`}
        >
          <Mountain className="w-3 h-3 text-orange-500" />
          Landslide Focus
        </button>
        <button
          id="map-filter-flood"
          onClick={() => onFilterChange('FLOOD')}
          className={`tactile-btn px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer ${filterHazard === 'FLOOD'
              ? 'bg-stone-800 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-950 hover:bg-white/80'
            }`}
        >
          <Waves className="w-3 h-3 text-orange-500" />
          Flood Focus
        </button>

        <div className="h-4 w-px bg-stone-200/80 mx-1 hidden sm:block" />

        {/* Quick Toggle: Composite Risk Heatmap */}
        <button
          id="btn-toggle-risk-heatmap"
          onClick={() => setShowHeatmap((prev) => !prev)}
          title="Overlay composite risk score heatmap across Assam basins"
          className={`tactile-btn px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${showHeatmap
              ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white shadow-sm shadow-orange-500/30 border border-orange-400/40'
              : 'bg-white/80 text-stone-700 hover:text-stone-950 hover:bg-white border border-stone-200/80'
            }`}
        >
          <Flame
            className={`w-3.5 h-3.5 transition-colors ${showHeatmap ? 'text-amber-200 fill-amber-200' : 'text-orange-600'
              }`}
          />
          <span>Risk Heatmap</span>
          <span
            className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wider ${showHeatmap ? 'bg-black/25 text-white' : 'bg-stone-200/80 text-stone-700'
              }`}
          >
            {showHeatmap ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Map Control Cluster (Layer Selector & Zoom Controls) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {/* Layer Selector Dropdown Button */}
        <div className="relative" ref={layerMenuRef}>
          <button
            id="btn-map-layers-toggle"
            onClick={() => setIsLayerMenuOpen((prev) => !prev)}
            className={`tactile-btn h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition shadow-xs cursor-pointer ${isLayerMenuOpen || baseLayer !== 'light'
                ? 'bg-stone-900 text-white border-stone-800'
                : 'glass-card text-stone-800 hover:bg-white'
              }`}
            title="Toggle Map Layers: Terrain Elevation & Satellite Imagery"
          >
            <Layers className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline">
              {BASE_LAYERS[baseLayer].label}
            </span>
            <span className="sm:hidden">Layers</span>
          </button>

          {/* Layer Selection Menu Popover */}
          {isLayerMenuOpen && (
            <div
              id="map-layer-popover"
              className="absolute right-0 top-full mt-2 w-72 glass-modal border border-white/80 rounded-2xl shadow-2xl p-3.5 text-stone-900 z-30"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/70">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-orange-100/80 text-orange-600">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Map Layers & Data
                  </span>
                </div>
                <button
                  onClick={() => setIsLayerMenuOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                  title="Close Menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Base Layer Options */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Base Map Provider
                </span>

                {(['light', 'terrain', 'satellite'] as BaseLayerType[]).map((layerKey) => {
                  const opt = BASE_LAYERS[layerKey];
                  const isActive = baseLayer === layerKey;
                  return (
                    <button
                      key={layerKey}
                      onClick={() => {
                        setBaseLayer(layerKey);
                      }}
                      className={`tactile-btn w-full text-left p-2.5 rounded-xl border transition flex items-start gap-2.5 cursor-pointer ${isActive
                          ? 'border-orange-500 bg-orange-50/70 text-stone-950 ring-1 ring-orange-400/40 shadow-xs'
                          : 'border-stone-200/80 bg-white/70 hover:border-stone-300 hover:bg-white text-stone-700'
                        }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {layerKey === 'light' && <MapIcon className="w-4 h-4 text-stone-600" />}
                        {layerKey === 'terrain' && <Mountain className="w-4 h-4 text-amber-600" />}
                        {layerKey === 'satellite' && <Globe className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{opt.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5 leading-tight line-clamp-2">
                          {opt.description}
                        </p>
                        <span className="text-[10px] text-stone-500 mt-1 inline-block font-mono">
                          Source: {opt.provider}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Overlays & Analytics Section */}
              <div className="pt-2.5 border-t border-stone-200/70 space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Overlays & Analytics
                </span>

                {/* Composite Risk Heatmap Toggle Card */}
                <label className="flex items-start justify-between p-2.5 rounded-xl border border-stone-200/80 bg-white/80 hover:bg-white hover:border-orange-300 cursor-pointer text-xs transition shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600 mt-0.5 shrink-0 shadow-2xs">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900">Composite Risk Heatmap</span>
                        {showHeatmap && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-orange-600 text-white shadow-2xs">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-tight mt-0.5">
                        Thermal gradient overlay weighted by composite scores (0-100)
                      </p>
                      <div className="mt-1.5 w-36 h-2 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 via-orange-500 via-red-500 to-red-900 border border-stone-200 shadow-inner" />
                    </div>
                  </div>
                  <input
                    id="checkbox-risk-heatmap-popover"
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="w-4 h-4 mt-1 rounded text-orange-600 focus:ring-orange-500 border-stone-300 accent-orange-600 cursor-pointer shrink-0"
                  />
                </label>

                {/* Place & River Labels Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white/80 cursor-pointer text-xs transition">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    <span className="font-semibold text-stone-800">Place & River Labels</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300 accent-orange-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Map Zoom & Center Control Buttons */}
        <div className="flex flex-col gap-1 glass-card border border-white/80 rounded-xl p-1 shadow-md">
          <button
            id="btn-map-zoom-in"
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100/80 transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="btn-map-zoom-out"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:text-stone-950 hover:bg-stone-100/80 transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-stone-200/80 mx-1" />
          <button
            id="btn-map-fit-bounds"
            onClick={handleResetBounds}
            title="Fit All Monitored Basins"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:text-orange-600 hover:bg-stone-100/80 transition cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tint Progression & Heatmap Legend */}
      <div className="absolute bottom-4 left-4 z-10 glass-card border border-white/80 p-3.5 rounded-2xl shadow-lg max-w-[360px]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-700">Early Warning Severity Scale</span>
          {showHeatmap && (
            <span className="text-[10px] font-bold text-orange-700 flex items-center gap-1 bg-orange-50/90 px-1.5 py-0.5 rounded-full border border-orange-200/80 shadow-2xs">
              <Flame className="w-3 h-3 text-orange-600 fill-orange-600" /> Heatmap Active
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {(['Low', 'Moderate', 'High', 'Severe'] as RiskLevel[]).map((lvl) => {
            const p = RISK_PALETTE[lvl];
            return (
              <div key={lvl} className="flex flex-col items-center">
                <div
                  className="w-full h-2 rounded-full mb-1 border shadow-2xs"
                  style={{ backgroundColor: p.mapFill, borderColor: p.mapStroke }}
                />
                <span className="text-[10px] font-bold text-stone-800">{lvl}</span>
              </div>
            );
          })}
        </div>

        {/* Continuous Composite Score Gradient Bar (Active when Heatmap is toggled) */}
        {showHeatmap && (
          <div className="mt-2.5 pt-2 border-t border-stone-200/70">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-700 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-600" />
                Composite Risk Thermal Field:
              </span>
              <span className="font-mono text-orange-700 font-bold">0 &rarr; 100 Score</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-yellow-200 via-amber-400 via-orange-500 via-red-500 to-red-900 border border-stone-200 shadow-inner" />
            <div className="flex justify-between text-[9px] text-stone-500 mt-1 font-semibold">
              <span>Low (0-25)</span>
              <span>Moderate (25-50)</span>
              <span>High (50-75)</span>
              <span>Severe (75-100)</span>
            </div>
          </div>
        )}

        <p className="mt-2 text-[10px] text-stone-600 border-t border-stone-200/70 pt-1.5 leading-tight font-normal">
          {showHeatmap
            ? 'Continuous thermal gradient reflects multi-parameter composite risk scores across all monitored Assam basins and slopes.'
            : 'Zones show watershed boundaries tinted by composite risk formula. Click any polygon or marker for live telemetry.'}
        </p>
      </div>
    </div>
  );
};
