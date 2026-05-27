/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';

export default function AviationClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLocal = (date: Date) => {
    // Vietnam Time (UTC+7)
    return date.toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatLocalDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatUTC = (date: Date) => {
    // UTC / Zulu Time
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds} Z`;
  };

  const formatUTCDate = (date: Date) => {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3.5 w-full max-w-sm mx-auto">
      {/* UTC / Zulu clock */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-center text-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-indigo-600 mb-1 uppercase">
          <Globe className="w-3.5 h-3.5" />
          Giờ UTC / ZULU
        </div>
        <div className="text-lg md:text-xl font-mono font-bold tracking-wider text-slate-900">
          {formatUTC(time)}
        </div>
        <div className="text-[9px] font-mono text-slate-500 tracking-wider mt-0.5 font-semibold">
          {formatUTCDate(time)}
        </div>
      </div>

      {/* Local Clock */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col items-center justify-center text-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-emerald-600 mb-1 uppercase">
          <Clock className="w-3.5 h-3.5" />
          Giờ Việt Nam (ICT)
        </div>
        <div className="text-lg md:text-xl font-mono font-bold tracking-wider text-slate-900">
          {formatLocal(time)}
        </div>
        <div className="text-[9px] font-mono text-slate-500 tracking-wider mt-0.5 font-semibold">
          {formatLocalDate(time)}
        </div>
      </div>
    </div>
  );
}
