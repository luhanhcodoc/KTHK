/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedWeather, SystemThreshold } from '../types';

// Map weather phenomena codes to Vietnamese
const WEATHER_PHENOMENA_DICT: { [key: string]: string } = {
  // Intensity / Proximity
  '-': 'Nhẹ',
  '+': 'Mạnh (Cực đoan)',
  'VC': 'Lân cận',

  // Descriptors
  'MI': 'Sương mù mỏng',
  'BC': 'Sương mù từng đám',
  'PR': 'Sương mù bao phủ một phần',
  'DR': 'Bụi cát/Tuyết thổi thấp',
  'BL': 'Bụi cát/Tuyết thổi cao',
  'SH': 'Mưa rào',
  'TS': 'Dông sét',
  'FZ': 'Đóng băng',

  // Precipitation
  'DZ': 'Mưa phùn',
  'RA': 'Mưa',
  'SN': 'Tuyết',
  'SG': 'Tuyết hạt',
  'IC': 'Băng kim',
  'PL': 'Hạt băng',
  'GR': 'Mưa đá',
  'GS': 'Mưa tuyết nhỏ',
  'SG_': 'Hạt tuyết',

  // Obscuration
  'BR': 'Sương mù nhẹ (BR)',
  'FG': 'Sương mù dày (FG)',
  'FU': 'Khói (FU)',
  'VA': 'Tro núi lửa',
  'DU': 'Bụi bặm rộng',
  'SA': 'Cát bốc',
  'HZ': 'Mù khô (HZ)',

  // Other
  'SQ': 'Gió giật lốc (SQ)',
  'FC': 'Vòi rồng / Lốc xoáy (FC)',
  'SS': 'Bão cát',
  'DS': 'Bão bụi',
  'PO': 'Cát xoáy'
};

// Translate weather phenomena codes
export function translatePhenomena(code: string): string {
  if (!code || code === 'NSW' || code === 'NOSIG') return 'Bình thường';
  
  let remains = code;
  let decoded = '';

  // Check prefix
  if (remains.startsWith('-')) {
    decoded += 'Mưa/Thời tiết nhẹ';
    remains = remains.slice(1);
  } else if (remains.startsWith('+')) {
    decoded += 'Mạnh / Cực đoan';
    remains = remains.slice(1);
  } else if (remains.startsWith('VC')) {
    decoded += 'Lân cận';
    remains = remains.slice(2);
  }

  // Parse remaining 2-letter tokens
  const tokens: string[] = [];
  for (let i = 0; i < remains.length; i += 2) {
    if (i + 2 <= remains.length) {
      tokens.push(remains.substring(i, i + 2));
    }
  }

  const translations = tokens
    .map(t => WEATHER_PHENOMENA_DICT[t] || t)
    .filter(Boolean);

  if (translations.length > 0) {
    if (decoded) {
      return `${translations.join(' + ')} (${decoded.trim()})`;
    }
    return translations.join(', ');
  }

  return code;
}

// Helper to calculate relative humidity using Magnus-Tetens formula
export function calculateHumidity(temp: number, dewPoint: number): number {
  if (isNaN(temp) || isNaN(dewPoint)) return 70; // fallback
  const a = 17.27;
  const b = 237.7;
  const alphaT = (a * temp) / (b + temp);
  const alphaTd = (a * dewPoint) / (b + dewPoint);
  const rh = 100 * Math.exp(alphaTd - alphaT);
  return Math.min(100, Math.max(0, Math.round(rh)));
}

/**
 * Parses raw METAR string into a ParsedWeather structure
 */
export function parseMetar(icao: string, rawMetar: string, thresholds: SystemThreshold): ParsedWeather {
  const cleanMetar = rawMetar.replace(/\s+/g, ' ').trim();
  const parts = cleanMetar.split(' ');

  // Default fallback values
  let dateTime = 'Không rõ';
  let rawTimeCode = '';
  let windDir = 'Không rõ';
  let windSpeed = 0;
  let windSpeedKt = 0;
  let windGust: number | null = null;
  let windGustKt: number | null = null;
  let visibility = 'Không rõ';
  let visibilityM = 10000;
  let cloudsList: string[] = [];
  let cloudsHeightM: number | null = null;
  let temp = 25;
  let dewPoint = 18;
  let pressure = 1013;
  let phenomenaList: string[] = [];
  let isExtremePhenomena = false;

  // Track parsed positions to skip
  const parsedIndexes = new Set<number>();

  // Find datetime group (usually matches \d{6}Z)
  const timeRegex = /^(\d{2})(\d{2})(\d{2})Z$/;
  // Wind group (usually matches (\d{3}|VRB)(\d{2})(G\d{2})?(KT|MPS))
  const windRegex = /^(\d{3}|VRB)(\d{2,3})(G\d{2,3})?(KT|MPS)$/;
  // Pressure QNH (matches Q\d{4})
  const pressureRegex = /^Q(\d{4})$/;
  // Temp/dewpoint (matches M?\d{2}\/M?\d{2})
  const tempRegex = /^(M?\d{2})\/(M?\d{2})$/;
  // Cloud groups (matches FEW\d{3}|SCT\d{3}|BKN\d{3}|OVC\d{3}|VV\d{3}|SKC|CLR|NSC|NCD|CAVOK)
  const cloudRegex = /^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$/;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // 1. Parse DateTime
    if (timeRegex.test(part)) {
      const match = part.match(timeRegex);
      if (match) {
        rawTimeCode = part;
        const day = match[1];
        const hour = match[2];
        const min = match[3];
        // Formatting standard
        dateTime = `${day}UTC lúc ${hour}:${min}`;
      }
      parsedIndexes.add(i);
      continue;
    }

    // 2. Parse Wind
    if (windRegex.test(part)) {
      const match = part.match(windRegex);
      if (match) {
        const dir = match[1];
        const speedVal = parseInt(match[2], 10);
        const gustVal = match[3] ? parseInt(match[3].slice(1), 10) : null;
        const unit = match[4];

        if (dir === 'VRB') {
          windDir = 'Biến động (VRB)';
        } else {
          windDir = `${dir}°`;
        }

        if (unit === 'KT') {
          windSpeedKt = speedVal;
          windSpeed = Math.round(speedVal * 0.5144 * 10) / 10;
          if (gustVal !== null) {
            windGustKt = gustVal;
            windGust = Math.round(gustVal * 0.5144 * 10) / 10;
          }
        } else {
          // MPS (m/s)
          windSpeed = speedVal;
          windSpeedKt = Math.round(speedVal / 0.5144);
          if (gustVal !== null) {
            windGust = gustVal;
            windGustKt = Math.round(gustVal / 0.5144);
          }
        }
      }
      parsedIndexes.add(i);
      continue;
    }

    // 3. Parse Temperature/Dewpoint
    if (tempRegex.test(part)) {
      const match = part.match(tempRegex);
      if (match) {
        const parseVal = (s: string) => {
          if (s.startsWith('M')) {
            return -parseInt(s.slice(1), 10);
          }
          return parseInt(s, 10);
        };
        temp = parseVal(match[1]);
        dewPoint = parseVal(match[2]);
      }
      parsedIndexes.add(i);
      continue;
    }

    // 4. Parse Pressure
    if (pressureRegex.test(part)) {
      const match = part.match(pressureRegex);
      if (match) {
        pressure = parseInt(match[1], 10);
      }
      parsedIndexes.add(i);
      continue;
    }

    // 5. Hardcoded CAVOK (No significant weather, good visibility)
    if (part === 'CAVOK') {
      visibility = '>10 km';
      visibilityM = 10000;
      cloudsList.push('Trời quang đãng, tầm nhìn tốt (CAVOK)');
      parsedIndexes.add(i);
      continue;
    }

    // 6. Cloud formations
    if (cloudRegex.test(part)) {
      const match = part.match(cloudRegex);
      if (match) {
        const type = match[1];
        const heightFt = parseInt(match[2], 10) * 100;
        const heightM = Math.round(heightFt * 0.3048);
        const convective = match[3] ? ` (${match[3]})` : '';
        
        let typeVi = '';
        switch (type) {
          case 'FEW': typeVi = `1-3 mây: ${heightM}m${convective}`; break;
          case 'SCT': typeVi = `3-5 mây: ${heightM}m${convective}`; break;
          case 'BKN': typeVi = `6-8 mây: ${heightM}m${convective}`; break;
          case 'OVC': typeVi = `10/10 mây: ${heightM}m${convective}`; break;
          case 'VV': typeVi = `Tầm nhìn thẳng đứng: ${heightM}m${convective}`; break;
        }

        cloudsList.push(typeVi);
        if (cloudsHeightM === null || heightM < cloudsHeightM) {
          cloudsHeightM = heightM; // Get lowest cloud ceiling
        }
      }
      parsedIndexes.add(i);
      continue;
    }

    if (part === 'SKC' || part === 'CLR') {
      cloudsList.push('không mây');
      parsedIndexes.add(i);
      continue;
    }

    if (part === 'NSC') {
      cloudsList.push('không mây (NSC)');
      parsedIndexes.add(i);
      continue;
    }

    if (part === 'NCD') {
      cloudsList.push('không mây (NCD)');
      parsedIndexes.add(i);
      continue;
    }

    // 7. Parse Visibility in meters (like 9999, 5000, 0800, etc.)
    // Standard rule: 4 digits
    if (/^\d{4}$/.test(part)) {
      const visM = parseInt(part, 10);
      visibilityM = visM;
      if (visM === 9999) {
        visibility = '>10 km';
      } else {
        visibility = `${(visM / 1000).toFixed(1)} km`;
      }
      parsedIndexes.add(i);
      continue;
    }
  }

  // 8. Find any unmatched parts that resemble weather phenomena
  // Standard weather phenomena codes: NSW, NOSIG, BECMG, TEMPO or starts with -, +, VC or has standard combinations e.g TSRA, HZ, FG, BR, etc.
  const knownPhenomenaCodes = ['RA', 'DZ', 'SN', 'SG', 'PL', 'GR', 'GS', 'BR', 'FG', 'HZ', 'FU', 'VA', 'DU', 'SA', 'SQ', 'FC', 'TS', 'SH', 'FZ'];
  
  for (let i = 0; i < parts.length; i++) {
    if (parsedIndexes.has(i)) continue;
    const part = parts[i];

    // Skip general identifier, timestamps, trending indicators (BECMG, TEMPO, NOSIG, AUTO)
    if (part === icao || part === 'METAR' || part === 'SPECI' || part === 'COR' || part === 'AUTO' || part === 'NIL' || part === 'NOSIG' || part === 'BECMG' || part === 'TEMPO') {
      continue;
    }

    // Check if it matches phenomena syntax: e.g. -TSRA, VCTSRA, DRSN, +SHRA, HZ, FG, etc.
    const baseCode = part.replace(/^[-+VC]+/g, '');
    let matched = false;
    for (const code of knownPhenomenaCodes) {
      if (baseCode.includes(code)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      phenomenaList.push(part);
      // Check if it's extreme
      for (const alertCode of thresholds.extremePhenomenaCodes) {
        if (part.includes(alertCode)) {
          isExtremePhenomena = true;
          break;
        }
      }
    }
  }

  // Formatting final results
  const clouds = cloudsList.length > 0 ? cloudsList.join('; ') : 'không mây';
  const phenomenaTranslated = phenomenaList.length > 0 
    ? phenomenaList.map(p => translatePhenomena(p)).join(', ') 
    : 'Bình thường (Bầu trời trong)';

  // Calculate humidity
  const humidity = calculateHumidity(temp, dewPoint);

  // Check alert condition: Temp >= 36°C OR Visibility < 5km OR Extreme Weather Phenomena
  const alertReasons: string[] = [];
  let isAlert = false;

  if (temp >= thresholds.tempAlertThreshold) {
    isAlert = true;
    alertReasons.push(`Nhiệt độ cao quá ngưỡng quy định (Nhiệt độ hiện tại: ${temp}°C >= ${thresholds.tempAlertThreshold}°C)`);
  }

  // Calculate visibility in km for numeric comparison
  const visKm = visibilityM / 1000;
  if (visKm < thresholds.visibilityAlertThreshold) {
    isAlert = true;
    alertReasons.push(`Tầm nhìn thấp nguy hiểm (Tầm nhìn: ${visKm.toFixed(1)} km < ${thresholds.visibilityAlertThreshold} km)`);
  }

  if (isExtremePhenomena) {
    isAlert = true;
    alertReasons.push(`Ghi nhận hiện tượng thời tiết cực đoan hàng không (${phenomenaTranslated})`);
  }

  // Create local readable display time based on a standard UTC offset +7 (Vietnam is UTC+7)
  let localTimeDisplay = dateTime;
  if (rawTimeCode) {
    const day = rawTimeCode.slice(0, 2);
    const hour = parseInt(rawTimeCode.slice(2, 4), 10);
    const min = rawTimeCode.slice(4, 6);

    // Convert GMT/UTC to GMT+7
    let localHour = (hour + 7) % 24;
    // Format to 2 digits
    const hourStr = localHour.toString().padStart(2, '0');
    // We assume the user's standard current year/month
    const now = new Date();
    const mockMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    localTimeDisplay = `${day}/${mockMonth} ${hourStr}:${min} (Giờ VN)`;
  }

  return {
    icao,
    rawMetar: cleanMetar,
    dateTime,
    localTimeDisplay,
    windDir,
    windSpeed,
    windSpeedKt,
    windGust,
    windGustKt,
    visibility,
    visibilityM,
    clouds,
    cloudsHeightM,
    temp,
    dewPoint,
    humidity,
    pressure,
    phenomena: phenomenaTranslated,
    isExtremePhenomena,
    isAlert,
    alertReasons
  };
}
