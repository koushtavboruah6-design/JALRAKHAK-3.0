export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface Zone {
  id: string;
  name: string;
  region: string;
  country: string;
  center: [number, number]; // [lat, lng]
  polygon: [number, number][]; // Coordinates defining the watershed / terrain catchment
  slope: number; // degrees (e.g., 8° to 44°)
  elevation: number; // meters above sea level
  riverProximityKm: number; // distance to drainage axis
  soilSaturationInitial: number; // % estimated antecedence (0-100)
  catchmentAreaKm2: number;
  population: number;
  criticalInfrastructure: string[];
  geologyDescription: string;
}

export interface WeatherRainfallData {
  currentRateMmPerHour: number;
  last24hMm: number;
  last72hMm: number;
  forecastNext24hMm: number;
  hourlyForecast: {
    time: string;
    precipitationMm: number;
    rainMm: number;
    probability: number;
  }[];
  dailyHistory: {
    date: string;
    rainfallMm: number;
    isForecast?: boolean;
  }[];
  lastUpdated: string;
  isLive: boolean;
  weatherDescription: string;
  temperatureC?: number;
  humidityPercent?: number;
  windSpeedKmh?: number;
  stationElevationM?: number;
  generationTimeMs?: number;
  liveIsoTimestamp?: string;
}

export interface FormulaBreakdownLandslide {
  intensityFactor: number;
  saturationFactor: number;
  slopeMultiplier: number;
  effective72hMm: number;
  rawScore: number;
}

export interface FormulaBreakdownFlood {
  accumulation24h: number;
  intensityFactor: number;
  riverProximityMultiplier: number;
  elevationFunnelMultiplier: number;
  rawScore: number;
}

export interface RiskAssessment {
  compositeScore: number; // 0 to 100
  overallLevel: RiskLevel;
  landslideScore: number; // 0 to 100
  landslideLevel: RiskLevel;
  landslideBreakdown: FormulaBreakdownLandslide;
  floodScore: number; // 0 to 100
  floodLevel: RiskLevel;
  floodBreakdown: FormulaBreakdownFlood;
  activeAdvisories: string[];
  recommendedAction: string;
  thresholdsTriggered: string[];
}

export interface ZoneWithTelemetry extends Zone {
  weather: WeatherRainfallData;
  assessment: RiskAssessment;
}

export interface EarlyWarningAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  region: string;
  level: RiskLevel;
  hazardType: 'LANDSLIDE' | 'FLASH_FLOOD' | 'EXTREME_RAINFALL' | 'MULTI_HAZARD';
  headline: string;
  recommendation: string;
  timestamp: string;
  compositeScore: number;
  acknowledged?: boolean;
}

export interface UserLocationCheck {
  lat: number;
  lng: number;
  nearestZone: ZoneWithTelemetry | null;
  distanceKm: number | null;
  timestamp: string;
}
