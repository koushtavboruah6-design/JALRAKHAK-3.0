import {
  RiskLevel,
  Zone,
  WeatherRainfallData,
  RiskAssessment,
  EarlyWarningAlert,
} from '../types';

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Severe';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Moderate';
  return 'Low';
}

export interface RiskStyleInfo {
  level: RiskLevel;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  mapFill: string;
  mapStroke: string;
  cardBorder: string;
  description: string;
}

export const RISK_PALETTE: Record<RiskLevel, RiskStyleInfo> = {
  Low: {
    level: 'Low',
    label: 'Low Risk',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-400',
    mapFill: '#FDE68A', // Pale amber
    mapStroke: '#D97706',
    cardBorder: 'border-amber-200/80',
    description: 'Precipitation within baseline thresholds; normal drainage active.',
  },
  Moderate: {
    level: 'Moderate',
    label: 'Moderate Risk',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    mapFill: '#FBBF24', // Warm amber-orange
    mapStroke: '#EA580C',
    cardBorder: 'border-amber-300',
    description: 'Elevated soil moisture and rising catchment runoff. Monitor advisories.',
  },
  High: {
    level: 'High',
    label: 'High Risk',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    badgeBorder: 'border-orange-700',
    dotColor: 'bg-orange-600',
    mapFill: '#EA580C', // Alert vibrant orange
    mapStroke: '#C2410C',
    cardBorder: 'border-orange-500',
    description: 'Threshold exceeded. Debris flow or riverbank overflow probable within 6-12h.',
  },
  Severe: {
    level: 'Severe',
    label: 'Severe Warning',
    badgeBg: 'bg-stone-900 text-orange-400 ring-1 ring-orange-500/50',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-600',
    dotColor: 'bg-orange-500',
    mapFill: '#9A3412', // Deep red-orange
    mapStroke: '#7C2D12',
    cardBorder: 'border-orange-600',
    description: 'Imminent catastrophic failure or rapid flash flooding. Evacuation in effect.',
  },
};

export function calculateZoneRisk(zone: Zone, weather: WeatherRainfallData): RiskAssessment {
  const currentRate = Math.max(0, weather.currentRateMmPerHour);
  const rain24h = Math.max(0, weather.last24hMm);
  const rain72h = Math.max(0, weather.last72hMm);

  // --- 1. Landslide Susceptibility Index (LSI) ---
  // Rainfall intensity component: high burst rates accelerate pore-water pressure immediately
  const intensityFactor = currentRate * 3.2;
  // Antecedent effective 72-hour moisture
  const effective72h = rain72h * 0.42;
  // Slope multiplier: shear stress is low below 15°, rises steeply between 25° and 45°
  const slopeClamped = Math.max(5, Math.min(50, zone.slope));
  const slopeMultiplier = Number((Math.pow(slopeClamped / 26, 1.65)).toFixed(2));
  // Soil saturation factor
  const saturationFactor = Number((1.0 + (zone.soilSaturationInitial / 100) * 0.55).toFixed(2));

  const rawLandslide = (intensityFactor + effective72h) * slopeMultiplier * saturationFactor * 0.45;
  const landslideScore = Math.min(100, Math.max(0, Math.round(rawLandslide)));
  const landslideLevel = getRiskLevel(landslideScore);

  // --- 2. Flash Flood Risk Index (FFI) ---
  // Accumulation in 24 hours dominates hydrological routing
  const floodAccumulation24 = rain24h * 0.68;
  const floodIntensity = currentRate * 3.6;
  // River proximity factor: areas within 0.3km receive immediate alluvial overtop
  const riverProximityClamped = Math.max(0.1, zone.riverProximityKm);
  const riverProximityMultiplier = Number(
    Math.max(0.6, 2.4 - riverProximityClamped * 0.55).toFixed(2)
  );
  // Elevation funnel proxy: lower elevation valley floors receive upstream watershed discharge
  const elevationFactor = Number(
    Math.max(0.7, 2.0 - (Math.min(zone.elevation, 1500) / 1200) * 0.85).toFixed(2)
  );

  const rawFlood =
    (floodAccumulation24 + floodIntensity) *
    riverProximityMultiplier *
    elevationFactor *
    0.40;
  const floodScore = Math.min(100, Math.max(0, Math.round(rawFlood)));
  const floodLevel = getRiskLevel(floodScore);

  // --- 3. Composite Score ---
  // Primary hazard receives 75% weight, secondary receives 25% weight
  const higherScore = Math.max(landslideScore, floodScore);
  const lowerScore = Math.min(landslideScore, floodScore);
  const compositeScore = Math.min(100, Math.round(higherScore * 0.75 + lowerScore * 0.25));
  const overallLevel = getRiskLevel(compositeScore);

  // Advisories & Recommendations
  const activeAdvisories: string[] = [];
  const thresholdsTriggered: string[] = [];

  if (currentRate >= 15) {
    activeAdvisories.push(`Torrential downpour detected (${currentRate.toFixed(1)} mm/h)`);
    thresholdsTriggered.push('Rain Intensity > 15 mm/h');
  } else if (currentRate >= 7.5) {
    activeAdvisories.push(`Heavy continuous rainfall (${currentRate.toFixed(1)} mm/h)`);
    thresholdsTriggered.push('Rain Intensity > 7.5 mm/h');
  }

  if (rain24h >= 100) {
    activeAdvisories.push(`Extreme 24-hr accumulation: ${rain24h.toFixed(1)} mm`);
    thresholdsTriggered.push('24h Accumulation > 100 mm');
  } else if (rain24h >= 60) {
    activeAdvisories.push(`Significant 24-hr accumulation: ${rain24h.toFixed(1)} mm`);
    thresholdsTriggered.push('24h Accumulation > 60 mm');
  }

  if (landslideScore >= 60 && zone.slope >= 28) {
    activeAdvisories.push(`Critical slope instability along ${zone.slope}° terrain`);
    thresholdsTriggered.push(`Slope (${zone.slope}°) + Moisture Threshold Exceeded`);
  }

  if (floodScore >= 60 && zone.riverProximityKm <= 0.5) {
    activeAdvisories.push(`Riparian surge risk within ${zone.riverProximityKm} km drainage corridor`);
    thresholdsTriggered.push(`River Buffer (${zone.riverProximityKm}km) Inundation`);
  }

  if (activeAdvisories.length === 0) {
    activeAdvisories.push('Atmospheric conditions stable; catchment drainage within capacity');
  }

  let recommendedAction = 'Routine situational monitoring. Keep standard communications active.';
  if (overallLevel === 'Moderate') {
    recommendedAction = 'Alert emergency services; clear low-lying culverts; monitor slope inclinometers.';
  } else if (overallLevel === 'High') {
    recommendedAction = 'Stage emergency personnel; restrict mountain passes; prepare low-lying populations for immediate staging.';
  } else if (overallLevel === 'Severe') {
    recommendedAction = 'EXECUTE IMMEDIATE EVACUATION. Halt transit through valley corridors and unstable slopes.';
  }

  return {
    compositeScore,
    overallLevel,
    landslideScore,
    landslideLevel,
    landslideBreakdown: {
      intensityFactor: Number(intensityFactor.toFixed(1)),
      saturationFactor,
      slopeMultiplier,
      effective72hMm: Number(effective72h.toFixed(1)),
      rawScore: Number(rawLandslide.toFixed(1)),
    },
    floodScore,
    floodLevel,
    floodBreakdown: {
      accumulation24h: Number(floodAccumulation24.toFixed(1)),
      intensityFactor: Number(floodIntensity.toFixed(1)),
      riverProximityMultiplier,
      elevationFunnelMultiplier: elevationFactor,
      rawScore: Number(rawFlood.toFixed(1)),
    },
    activeAdvisories,
    recommendedAction,
    thresholdsTriggered,
  };
}

export function generateZoneAlert(zone: Zone, assessment: RiskAssessment): EarlyWarningAlert | null {
  if (assessment.overallLevel !== 'High' && assessment.overallLevel !== 'Severe') {
    return null;
  }

  let hazardType: EarlyWarningAlert['hazardType'] = 'MULTI_HAZARD';
  if (assessment.landslideScore >= 65 && assessment.floodScore < 60) {
    hazardType = 'LANDSLIDE';
  } else if (assessment.floodScore >= 65 && assessment.landslideScore < 60) {
    hazardType = 'FLASH_FLOOD';
  } else if (assessment.landslideScore >= 60 && assessment.floodScore >= 60) {
    hazardType = 'MULTI_HAZARD';
  } else {
    hazardType = 'EXTREME_RAINFALL';
  }

  const headline =
    assessment.overallLevel === 'Severe'
      ? `CRITICAL WARNING: Imminent ${hazardType.replace('_', ' ')} in ${zone.name}`
      : `HIGH ALERT: Elevated ${hazardType.replace('_', ' ')} Hazard in ${zone.name}`;

  return {
    id: `alert-${zone.id}-${Date.now()}`,
    zoneId: zone.id,
    zoneName: zone.name,
    region: zone.region,
    level: assessment.overallLevel,
    hazardType,
    headline,
    recommendation: assessment.recommendedAction,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    compositeScore: assessment.compositeScore,
    acknowledged: false,
  };
}

// Distance helper for "Check my area"
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2) ||
    !isFinite(lat1) ||
    !isFinite(lon1) ||
    !isFinite(lat2) ||
    !isFinite(lon2)
  ) {
    return Infinity;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

