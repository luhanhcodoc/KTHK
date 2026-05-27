/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AirportRegion = 'Bắc' | 'Trung' | 'Nam';

export interface Airport {
  id: string;
  name: string;
  icao: string;
  iata: string;
  region: AirportRegion;
  priority: number;
  enabled: boolean;
  customNotes?: string;
}

export interface ParsedWeather {
  icao: string;
  rawMetar: string;
  dateTime: string; // Formatting: "DD/MM HH:mm UTC" + local conversion
  localTimeDisplay?: string; // Standardized local timezone display
  windDir: string; // e.g., "240°" or "Variable"
  windSpeed: number; // in m/s
  windSpeedKt: number; // in knots
  windGust: number | null; // in m/s
  windGustKt?: number | null;
  visibility: string; // e.g., ">10 km" or "3.5 km"
  visibilityM: number; // in meters
  clouds: string; // Human Vietnamese translation e.g. "Mây thưa ở 600m"
  cloudsHeightM: number | null; // Cloud base height in meters (or null if clear)
  temp: number; // in °C
  dewPoint: number; // in °C
  humidity: number; // Relative humidity (%) calculated from temp/dewpoint
  pressure: number; // QNH pressure in hPa
  phenomena: string; // e.g., "Mưa dông nhẹ", "Sương mù", "Không có"
  isExtremePhenomena: boolean;
  isAlert: boolean; // Flagged when Temp >= 36, Visibility < 5km, or Extreme Phenomena
  alertReasons: string[]; // Reasons for the alert being triggered
}

export interface SystemThreshold {
  tempAlertThreshold: number; // default 36
  visibilityAlertThreshold: number; // default 5 (km)
  extremePhenomenaCodes: string[]; // e.g. ["TS", "RA", "FG", "+RA", "SQ", "FC"]
}

export interface WeatherSummary {
  summary: string;
  potentialHazards: string;
  advice: string;
  lastUpdated: string;
}

export interface ContentConfig {
  airports: Airport[];
  thresholds: SystemThreshold;
  lastUpdated: string;
}
