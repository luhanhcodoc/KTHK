/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Fragment } from 'react';
import { ParsedWeather, Airport, SystemThreshold } from '../types';
import { Search, Filter, AlertOctagon, Terminal, HelpCircle, FileText, Compass, Sparkles, Navigation, AlertTriangle } from 'lucide-react';

interface WeatherTableProps {
  weatherList: ParsedWeather[];
  airports: Airport[];
  thresholds: SystemThreshold;
}

export default function WeatherTable({ weatherList, airports, thresholds }: WeatherTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [alertOnly, setAlertOnly] = useState(false);
  const [expandedIcao, setExpandedIcao] = useState<string | null>(null);

  // Match corresponding airport metadata for description notes
  const getAirportMetadata = (icao: string): Airport | undefined => {
    return airports.find(ap => ap.icao.toLowerCase() === icao.toLowerCase());
  };

  // Filter lists
  const filteredWeatherList = weatherList.filter(weather => {
    const meta = getAirportMetadata(weather.icao);
    const searchMatch = 
      weather.icao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meta ? meta.name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (meta ? meta.iata.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    
    const regionMatch = regionFilter === 'All' || (meta ? meta.region === regionFilter : false);
    const alertMatch = !alertOnly || weather.isAlert;

    return searchMatch && regionMatch && alertMatch;
  });

  const toggleRowExpand = (icao: string) => {
    if (expandedIcao === icao) {
      setExpandedIcao(null);
    } else {
      setExpandedIcao(icao);
    }
  };

  // Returns true if a specific property triggered the alert
  const checkAlertTrigger = (weather: ParsedWeather, property: 'temp' | 'visibility' | 'phenomena'): boolean => {
    if (!weather.isAlert) return false;
    if (property === 'temp' && weather.temp >= thresholds.tempAlertThreshold) return true;
    
    // Check numeric visibility in km
    const visibilityKm = weather.visibilityM / 1000;
    if (property === 'visibility' && visibilityKm < thresholds.visibilityAlertThreshold) return true;
    
    if (property === 'phenomena' && weather.isExtremePhenomena) return true;
    return false;
  };

  return (
    <div className="space-y-4 w-full">
      {/* Table Filters Panel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-airport-input"
              type="text"
              placeholder="Tìm theo tên sân bay, mã ICAO, IATA..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Region selector */}
          <div className="flex items-center gap-1.5 w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="region-filter-select"
              className="bg-transparent text-sm focus:outline-none text-slate-700 font-medium cursor-pointer"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="All">Tất cả các Miền</option>
              <option value="Trung">Ưu tiên Miền Trung</option>
              <option value="Bắc">Miền Bắc</option>
              <option value="Nam">Miền Nam</option>
            </select>
          </div>
        </div>

        {/* Dynamic Warning Alert filters */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            id="toggle-alert-only-btn"
            onClick={() => setAlertOnly(!alertOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              alertOnly 
                ? 'bg-red-500 text-white shadow-sm hover:bg-red-600' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Hiển thị Trạm Cảnh báo ({weatherList.filter(w => w.isAlert).length})
          </button>
        </div>
      </div>

      {/* Main Meteorological Data Display */}
      {filteredWeatherList.length === 0 ? (
        <div id="empty-table-state" className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center shadow-sm max-w-lg mx-auto">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy sân bay</h3>
          <p className="text-sm text-slate-500 mt-1">Vui lòng điều chỉnh điều kiện lọc hoặc kiểm tra lại tên tìm kiếm.</p>
        </div>
      ) : (
        <>
          {/* Desktop Visual Table */}
          <div id="desktop-weather-table" className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 tracking-wider uppercase font-sans">
                    <th className="py-3.5 px-4 w-2/12">Tên Sân Bay</th>
                    <th className="py-3.5 px-3 text-center w-1/12">Mã ICAO / IATA</th>
                    <th className="py-3.5 px-3 w-1.5/12">Thời Gian Số Liệu</th>
                    <th className="py-3.5 px-3 w-1.5/12">Tầm Nhìn</th>
                    <th className="py-3.5 px-3 w-2/12">Mây & Trần Trực Quan</th>
                    <th className="py-3.5 px-3 w-1/12 text-center">Nhiệt Độ (°C)</th>
                    <th className="py-3.5 px-3 w-1/12 text-center">Hướng Gió</th>
                    <th className="py-3.5 px-3 w-1/12 text-center">Tốc Độ Gió</th>
                    <th className="py-3.5 px-3 w-2/12">Hiện Tượng Thời Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredWeatherList.map((weather) => {
                    const meta = getAirportMetadata(weather.icao);
                    const isTempAlert = checkAlertTrigger(weather, 'temp');
                    const isVisAlert = checkAlertTrigger(weather, 'visibility');
                    const isPhenomAlert = checkAlertTrigger(weather, 'phenomena');
                    
                    const isRowExpanded = expandedIcao === weather.icao;

                    return (
                      <Fragment key={weather.icao}>
                        {/* Summary primary row */}
                        <tr 
                          onClick={() => toggleRowExpand(weather.icao)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                            weather.isAlert ? 'bg-red-50/20' : ''
                          } ${isRowExpanded ? 'bg-slate-50/50' : ''}`}
                        >
                          {/* 1. Airport Name */}
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{meta ? meta.name : 'Sân bay chưa đặt tên'}</span>
                              {meta?.region === 'Trung' && (
                                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  M.Trung
                                </span>
                              )}
                              {weather.isAlert && (
                                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse flex items-center gap-1">
                                  C.Báo
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. ICAO / IATA */}
                          <td className="py-4 px-3 text-center">
                            <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 py-1 px-1.5 rounded-lg inline-block">
                              {weather.icao} / <span className="text-indigo-600">{meta?.iata || 'N/A'}</span>
                            </div>
                          </td>

                          {/* 3. Time Details */}
                          <td className="py-4 px-3 font-medium text-slate-500 font-mono text-xs">
                            {weather.localTimeDisplay}
                          </td>

                          {/* 4. Visibility (km) - Alert highlighted */}
                          <td className={`py-4 px-3 font-mono ${
                            isVisAlert ? 'text-red-600 font-extrabold text-base' : 'text-slate-700 font-medium'
                          }`}>
                            {weather.visibility}
                          </td>

                          {/* 5. Clouds altitude translation */}
                          <td className="py-4 px-3 text-slate-600 text-xs tracking-tight line-clamp-2 max-w-xs pt-5">
                            {weather.clouds}
                          </td>

                          {/* 6. Temperature (C) - Alert highlighted */}
                          <td className={`py-4 px-3 text-center font-mono text-sm ${
                            isTempAlert ? 'text-red-600 font-extrabold text-base' : 'text-slate-800 font-semibold'
                          }`}>
                            {weather.temp}°C
                          </td>

                          {/* 7. Wind direction */}
                          <td className="py-4 px-3 text-center font-mono text-slate-600 text-xs">
                            <div className="flex items-center justify-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-slate-400" />
                              <span>{weather.windDir}</span>
                            </div>
                          </td>

                          {/* 8. Wind speed m/s and knots */}
                          <td className="py-4 px-3 text-center font-mono text-slate-700 text-xs">
                            <span className="font-bold">{weather.windSpeed}</span> m/s 
                            <span className="block text-[10px] text-slate-400">({weather.windSpeedKt} kt)</span>
                          </td>

                          {/* 9. Weather Phenomena - Alert highlighted */}
                          <td className={`py-4 px-3 font-medium ${
                            isPhenomAlert ? 'text-red-600 font-extrabold text-sm' : 'text-slate-600'
                          }`}>
                            {weather.phenomena}
                          </td>
                        </tr>

                        {/* Detailed secondary expandable panel */}
                        {isRowExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={9} className="py-4 px-6 border-t border-b border-indigo-50/80">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-slate-700">
                                {/* METAR block */}
                                <div className="md:col-span-5 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>CHỈ SỐ MÃ HÓA KHÍ TƯỢNG GỐC (RAW METAR)</span>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-200 text-indigo-700 font-mono text-xs p-3 rounded-xl select-all break-all font-semibold">
                                    {weather.rawMetar}
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-normal flex items-start gap-1">
                                    <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                                    <span>Mã METAR do Sân bay xuất bản tự động, được hệ thống của Air Traffic Management AMC đồng bộ.</span>
                                  </div>
                                </div>

                                {/* Airport Details & CMS notes */}
                                <div className="md:col-span-4 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>GHI CHÚ HÀNG KHÔNG QUẢN LÝ (CMS NOTES)</span>
                                  </div>
                                  <div className="bg-white border border-slate-200/85 p-3 rounded-xl text-xs space-y-1 shadow-sm">
                                    <div className="text-slate-500 font-semibold font-sans">Vùng: <span className="text-slate-800 font-medium">Miền {meta?.region || 'Không rõ'}</span></div>
                                    <div className="text-slate-500 font-semibold font-sans">Ủy viên ĐH: <span className="text-slate-800 font-medium">Trọng số {meta?.priority}</span></div>
                                    <div className="text-slate-500 font-semibold font-sans mt-1.5">Nội dung chỉ dẫn:</div>
                                    <p className="text-slate-700 italic bg-amber-50/50 p-1.5 rounded-lg border border-amber-100 text-xs">
                                      {meta?.customNotes || 'Chưa ghi chú lưu ý cụ thể từ hệ thống quản lý CMS.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Meteorological calculations */}
                                <div className="md:col-span-3 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>CHỈ SỐ KỸ THUẬT PHỤ</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center shadow-sm">
                                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">ĐỘ ẨM TƯƠNG ĐỐI</span>
                                      <span className="font-mono font-bold text-base text-slate-800">{weather.humidity}%</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center shadow-sm">
                                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">ÁP SUẤT TRẠM QNH</span>
                                      <span className="font-mono font-bold text-base text-slate-800">{weather.pressure} hPa</span>
                                    </div>
                                  </div>

                                  {/* Warning Alerts breakdown */}
                                  {weather.isAlert && (
                                    <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-2.5 text-xs space-y-1">
                                      <div className="font-bold flex items-center gap-1 text-red-900">
                                        <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                                        <span>Chi tiết lý do dán thẻ cảnh báo:</span>
                                      </div>
                                      <ul className="list-disc pl-4 space-y-0.5 text-[10px] leading-relaxed text-red-700">
                                        {weather.alertReasons.map((r, ri) => (
                                          <li key={ri}>{r}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid Layout for mobile displays */}
          <div id="mobile-weather-cards" className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWeatherList.map(weather => {
              const meta = getAirportMetadata(weather.icao);
              const isTempAlert = checkAlertTrigger(weather, 'temp');
              const isVisAlert = checkAlertTrigger(weather, 'visibility');
              const isPhenomAlert = checkAlertTrigger(weather, 'phenomena');
              const isCardExpanded = expandedIcao === weather.icao;

              return (
                <div 
                  key={weather.icao}
                  id={`mobile-card-${weather.icao}`}
                  className={`border rounded-2xl p-4 shadow-sm transition-all duration-300 bg-white ${
                    weather.isAlert 
                      ? 'border-red-200 bg-red-50/5' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-base">
                        {meta ? meta.name : 'Sân bay'}
                        {meta?.region === 'Trung' && (
                          <span className="bg-indigo-100 text-indigo-800 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            M.Trung
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {weather.icao} / <span className="text-indigo-600">{meta?.iata}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">{weather.localTimeDisplay}</span>
                      {weather.isAlert && (
                        <span className="bg-red-500 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full mt-1 inline-block animate-pulse">
                          Cảnh Báo Nguy Hiểm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core indicators row */}
                  <div className="grid grid-cols-3 gap-2 mt-4 border-t border-b border-slate-100 py-3 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Nhiệt Độ</span>
                      <span className={`font-mono text-sm font-semibold block ${isTempAlert ? 'text-red-600 font-extrabold text-base' : 'text-slate-800'}`}>
                        {weather.temp}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Tầm Nhìn</span>
                      <span className={`font-mono text-sm font-semibold block ${isVisAlert ? 'text-red-600 font-extrabold text-base' : 'text-slate-800'}`}>
                        {weather.visibility}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Mây</span>
                      <span className="text-[11px] text-slate-600 font-semibold block truncate px-1" title={weather.clouds}>
                        {weather.clouds.split('; ')[0] || 'Trong lành'}
                      </span>
                    </div>
                  </div>

                  {/* Operational indicators row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-slate-600 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 text-[9px] uppercase block mb-0.5">Hướng & Tốc Gió</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {weather.windDir} | {weather.windSpeed} m/s
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 text-[9px] uppercase block mb-0.5">Thời Tiết</span>
                      <span className={`font-medium ${isPhenomAlert ? 'text-red-600 font-extrabold' : 'text-slate-600'}`}>
                        {weather.phenomena}
                      </span>
                    </div>
                  </div>

                  {/* Custom alert explanations */}
                  {weather.isAlert && (
                    <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-2.5 text-[11px] mt-3 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Cảnh báo:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-red-700 font-medium text-[10px]">
                        {weather.alertReasons.map((r, ri) => (
                          <li key={ri}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expand button */}
                  <div className="mt-4 flex gap-2">
                    <button
                      id={`btn-expand-mobile-${weather.icao}`}
                      onClick={() => toggleRowExpand(weather.icao)}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      {isCardExpanded ? 'Đóng Chi Tiết METAR' : 'Xem Raw METAR / CMS'}
                    </button>
                  </div>

                  {/* Expand mobile contents */}
                  {isCardExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs bg-slate-50/50 p-3 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Raw METAR:</span>
                        <div className="bg-slate-900 text-teal-400 font-mono text-[10px] p-2.5 rounded-lg break-all select-all shadow-inner">
                          {weather.rawMetar}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Lưu ý phi hành đoàn (CMS):</span>
                        <p className="bg-white border border-slate-200 p-2.5 rounded-lg text-slate-700 italic">
                          {meta?.customNotes || 'Không có hướng dẫn bảo trì hay lưu ý cụ thể.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                        <div className="bg-white border border-slate-200 p-2 rounded-lg">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Độ ẩm</span>
                          <span className="font-mono font-bold text-slate-700">{weather.humidity}%</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-2 rounded-lg">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Áp suất QNH</span>
                          <span className="font-mono font-bold text-slate-700">{weather.pressure} hPa</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
