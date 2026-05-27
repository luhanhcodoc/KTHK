/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedWeather } from '../types';
import { Plane, Thermometer, Wind, Eye, Cloud, AlertTriangle, Clock } from 'lucide-react';

interface StatsProps {
  weatherList: ParsedWeather[];
}

export default function StatsGrid({ weatherList }: StatsProps) {
  const getAirportData = (icao: string, defaultName: string) => {
    const rawData = weatherList.find(w => w.icao.toUpperCase() === icao.toUpperCase());
    return {
      icao,
      name: defaultName,
      data: rawData
    };
  };

  const airports = [
    getAirportData('VVDN', 'Đà Nẵng'),
    getAirportData('VVCA', 'Chu Lai'),
    getAirportData('VVPC', 'Phù Cát'),
    getAirportData('VVPK', 'Pleiku'),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {airports.map(({ icao, name, data }) => {
        if (!data) {
          return (
            <div 
              key={icao} 
              id={`airport-${icao.toLowerCase()}`}
              className="p-4 rounded-xl border border-slate-200 bg-white transition-all duration-300 shadow-xs flex flex-row items-center justify-between min-h-[140px]"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{name}</span>
                <span className="text-lg font-extrabold font-mono text-slate-300 mt-1">{icao}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic">Đang tải...</div>
            </div>
          );
        }

        // Determine if alert/dangerous conditions apply
        const isHighTemp = data.temp >= 36;
        const isLowVisibility = data.visibilityM < 5000;
        const isDangerousWeather = data.isExtremePhenomena;
        const isAlert = data.isAlert || isHighTemp || isLowVisibility || isDangerousWeather;

        // Visual cloud representation
        const mainCloud = data.clouds.split('; ')[0] || 'không mây';

        // Extract time from localTimeDisplay (e.g. "27/05 12:00 (Giờ VN)" -> "12:00")
        let timeFormatted = 'Không rõ';
        if (data.localTimeDisplay) {
          // Find standard time string like HH:mm
          const matchTime = data.localTimeDisplay.match(/(\d{2}:\d{2})/);
          if (matchTime) {
            timeFormatted = matchTime[1];
          } else {
            timeFormatted = data.localTimeDisplay.replace(' (Giờ VN)', '');
          }
        }

        return (
          <div 
            key={icao} 
            id={`airport-${icao.toLowerCase()}`}
            className={`p-4 rounded-xl border transition-all duration-300 shadow-xs flex flex-col justify-between min-h-[155px] relative overflow-hidden group ${
              isAlert 
                ? 'border-red-300 bg-red-50/20 hover:bg-red-50/35 text-slate-800 shadow-red-50/10' 
                : 'border-slate-200 bg-white hover:bg-slate-50/50 text-slate-800'
            }`}
          >
            {/* Header row: Airport text and badge */}
            <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-dashed border-slate-100">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Plane className={`w-3.5 h-3.5 shrink-0 ${isAlert ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-[12px] font-extrabold text-slate-900 tracking-tight truncate uppercase">
                    {name}
                  </span>
                </div>
                {/* Observation time (Giờ Việt Nam) */}
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mt-0.5" title="Thời gian quan trắc">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>QT: <span className="text-slate-700 font-mono font-extrabold">{timeFormatted}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md border ${
                  isAlert 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {icao}
                </span>
              </div>
            </div>

            {/* Middle row: Temp and Wind metrics */}
            <div className="grid grid-cols-2 gap-2 py-2 text-slate-800">
              {/* Temperature block. Rule: Temp >= 36 -> Display large thick red text */}
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Nhiệt độ</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <Thermometer className={`w-4 h-4 shrink-0 self-center ${isHighTemp ? 'text-red-700' : 'text-orange-500'}`} />
                  <span className={`font-mono leading-none tracking-tight ${
                    isHighTemp 
                      ? 'text-2xl font-black text-red-700 underline decoration-red-450 decoration-2' 
                      : 'text-base font-bold'
                  }`}>
                    {data.temp}°C
                  </span>
                </div>
              </div>

              {/* Wind block. Rule: show speed and wind direction in degrees */}
              <div className="flex flex-col justify-center border-l border-slate-100 pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gió / Hướng</span>
                <div className="flex flex-col mt-1">
                  <div className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-sm font-bold font-mono text-slate-900 leading-none">
                      {data.windSpeed}m/s
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 mt-0.5 pl-4.5">
                    Độ: {data.windDir}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom details row: Visibility and Clouds */}
            <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2.5">
                {/* Visibility block. Rule: Visibility < 5km -> Display big, bold, dark red text */}
                <div className="flex items-center gap-1 min-w-0" title={`Tầm nhìn: ${data.visibility}`}>
                  <Eye className={`w-3.5 h-3.5 shrink-0 ${isLowVisibility ? 'text-red-750' : 'text-slate-400'}`} />
                  <span className={`font-mono truncate ${
                    isLowVisibility 
                      ? 'text-sm font-black text-red-700 tracking-tight' 
                      : 'text-[10px] font-bold text-slate-600'
                  }`}>
                    {isLowVisibility ? `Tầm nhìn: ${data.visibility} (Thấp)` : `TN: ${data.visibility}`}
                  </span>
                </div>

                {/* Cloud block */}
                <div className="flex items-center gap-1 text-right truncate max-w-[50%]" title={`Mây: ${data.clouds}`}>
                  <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-600 font-extrabold truncate uppercase">{mainCloud}</span>
                </div>
              </div>

              {/* Dangerous Meteorological Phenomena rule: If present, display as big, bold, red string */}
              {isDangerousWeather && (
                <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-1.5 flex items-start gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-[10.5px] font-extrabold text-red-700 leading-tight uppercase font-mono tracking-tight">
                    THỜI TIẾT NC: {data.phenomena}
                  </div>
                </div>
              )}
            </div>

            {/* Warning visual badge */}
            {isAlert && !isDangerousWeather && (
              <div className="absolute right-0 bottom-0 bg-red-500/10 p-0.5 rounded-tl-lg pointer-events-none">
                <AlertTriangle className="w-3 h-3 text-red-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
