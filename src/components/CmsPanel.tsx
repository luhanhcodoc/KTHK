/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Airport, SystemThreshold, ContentConfig } from '../types';
import { Settings, Plus, Trash2, Save, Undo, Info, Sliders, ShieldAlert, BookOpen, ToggleLeft, ToggleRight, CheckSquare } from 'lucide-react';

interface CmsPanelProps {
  config: ContentConfig;
  onSave: (newConfig: ContentConfig) => Promise<void>;
  onReset: () => Promise<void>;
}

export default function CmsPanel({ config, onSave, onReset }: CmsPanelProps) {
  // Deep clone config for state
  const [airports, setAirports] = useState<Airport[]>(JSON.parse(JSON.stringify(config.airports)));
  const [thresholds, setThresholds] = useState<SystemThreshold>(JSON.parse(JSON.stringify(config.thresholds)));
  
  // Adding Airport states
  const [newApName, setNewApName] = useState('');
  const [newApIcao, setNewApIcao] = useState('');
  const [newApIata, setNewApIata] = useState('');
  const [newApRegion, setNewApRegion] = useState<'Bắc' | 'Trung' | 'Nam'>('Trung');
  const [newApNotes, setNewApNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fields update helpers
  const handleAirportChange = (id: string, field: keyof Airport, value: any) => {
    setAirports(prev =>
      prev.map(ap => (ap.id === id ? { ...ap, [field]: value } : ap))
    );
  };

  const handleAddNewAirport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newApName.trim() || !newApIcao.trim() || !newApIata.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên, mã ICAO và IATA của sân bay mới.');
      return;
    }

    const icaoUpper = newApIcao.trim().toUpperCase();
    const iataUpper = newApIata.trim().toUpperCase();

    // Check if ICAO is standard 4 chars
    if (icaoUpper.length !== 4) {
      setErrorMsg('Mã ICAO phải chứa đúng 4 ký tự (Ví dụ: VVTS, VVDN).');
      return;
    }

    // Check if ICAO exists
    const exists = airports.some(ap => ap.icao === icaoUpper);
    if (exists) {
      setErrorMsg(`Mã ICAO ${icaoUpper} đã tồn tại trong danh sách quản lý.`);
      return;
    }

    const newAirport: Airport = {
      id: Date.now().toString(),
      name: newApName.trim(),
      icao: icaoUpper,
      iata: iataUpper,
      region: newApRegion,
      priority: airports.length + 1,
      enabled: true,
      customNotes: newApNotes.trim() || undefined
    };

    setAirports(prev => [...prev, newAirport]);
    
    // Clear forms
    setNewApName('');
    setNewApIcao('');
    setNewApIata('');
    setNewApNotes('');

    setSuccessMsg('Đã thêm sân bay mới vào danh sách soạn thảo tạm thời. Nhấn "Lưu Toàn bộ Thiết lập" để cập nhật lâu dài.');
  };

  const handleDeleteAirport = (id: string) => {
    setAirports(prev => prev.filter(ap => ap.id !== id));
  };

  const handleThresholdsChange = (field: keyof SystemThreshold, value: any) => {
    setThresholds(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTogglePhenomenaCode = (code: string) => {
    const currentList = [...thresholds.extremePhenomenaCodes];
    if (currentList.includes(code)) {
      handleThresholdsChange('extremePhenomenaCodes', currentList.filter(c => c !== code));
    } else {
      handleThresholdsChange('extremePhenomenaCodes', [...currentList, code]);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Re-map index based priorities
      const sorted = [...airports].map((ap, i) => ({
        ...ap,
        priority: i + 1
      }));

      await onSave({
        airports: sorted,
        thresholds,
        lastUpdated: new Date().toISOString()
      });
      setSuccessMsg('Lưu cấu hình CMS thành công! Hệ thống đã ghi nhận toàn bộ thông số rào cản và danh sách sân bay.');
      // Update local state to matched priorities
      setAirports(sorted);
    } catch (err: any) {
      setErrorMsg(`Có lỗi xảy ra: ${err.message || 'vui lòng kiểm tra kết nối với Server.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ danh sách sân bay và thông số cảnh báo thời tiết về mặc định hệ thống? Tất cả các sân bay tự thêm và mô phỏng sẽ bị xóa.')) {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        await onReset();
        // Update local views to standard defaults matching parent config
        setAirports(JSON.parse(JSON.stringify(config.airports)));
        setThresholds(JSON.parse(JSON.stringify(config.thresholds)));
        setSuccessMsg('Khôi phục cơ sở dữ liệu CMS về mặc định thành công!');
      } catch (err: any) {
        setErrorMsg(`Lỗi khi khôi phục dữ liệu: ${err.message}`);
      } finally {
        setSaving(false);
      }
    }
  };

  // Re-order weights
  const moveAirport = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === airports.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...airports];
    
    // Swap positions
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setAirports(reordered);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
      {/* Sidebar: Add Airport Form & Threshold Settings */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* System Thresholds form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Cấu Hình Ngưỡng Cảnh Báo</h3>
          </div>

          <div className="space-y-3.5">
            {/* Temp trigger */}
            <div className="space-y-1">
              <label htmlFor="temp-alert-threshold" className="text-xs font-semibold text-slate-500 block">Nhiệt Độ Cảnh Báo (°C)</label>
              <div className="flex items-center gap-2">
                <input
                  id="temp-alert-threshold"
                  type="number"
                  className="bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 font-mono text-sm w-full font-bold text-slate-800"
                  value={thresholds.tempAlertThreshold}
                  onChange={(e) => handleThresholdsChange('tempAlertThreshold', Number(e.target.value))}
                />
                <span className="text-sm font-semibold text-slate-500">°C Trở lên</span>
              </div>
            </div>

            {/* Visibility trigger */}
            <div className="space-y-1">
              <label htmlFor="vis-alert-threshold" className="text-xs font-semibold text-slate-500 block">Tầm Nhìn Cảnh Báo (km)</label>
              <div className="flex items-center gap-2">
                <input
                  id="vis-alert-threshold"
                  type="number"
                  step="0.1"
                  className="bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 font-mono text-sm w-full font-bold text-slate-800"
                  value={thresholds.visibilityAlertThreshold}
                  onChange={(e) => handleThresholdsChange('visibilityAlertThreshold', Number(e.target.value))}
                />
                <span className="text-sm font-semibold text-slate-500">km Dưới</span>
              </div>
            </div>

            {/* Extreme weather indicators checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 block">Hiện Tượng Hàng Không Cực Đoan</label>
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 grid grid-cols-2 gap-2.5">
                {[
                  { code: 'TS', desc: 'Dông sét' },
                  { code: 'RA', desc: 'Mưa dày' },
                  { code: 'FG', desc: 'Sương mù dày' },
                  { code: 'SQ', desc: 'Gió giật mạnh' },
                  { code: 'FC', desc: 'Vòi rồng' },
                  { code: 'GR', desc: 'Mưa đá' }
                ].map(item => {
                  const isActive = thresholds.extremePhenomenaCodes.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      onClick={() => handleTogglePhenomenaCode(item.code)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer border hover:border-slate-300 transition text-left ${
                        isActive 
                          ? 'bg-red-50 border-red-200 text-red-800 font-bold' 
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <CheckSquare className={`w-3.5 h-3.5 text-slate-400 shrink-0 ${isActive ? 'text-red-500 fill-red-100' : ''}`} />
                      <div>
                        <div className="font-mono text-[10px] leading-3 text-slate-500">{item.code}</div>
                        <div className="text-[11px] font-sans">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Airport Adding form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Thêm Sân Bay Mới</h3>
          </div>

          <form onSubmit={handleAddNewAirport} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="new-ap-name" className="text-xs font-semibold text-slate-500 block">Tên Sân Bay</label>
              <input
                id="new-ap-name"
                type="text"
                placeholder="Ví dụ: Sân bay Côn Đảo"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 text-sm text-slate-800"
                value={newApName}
                onChange={(e) => setNewApName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="new-ap-icao" className="text-xs font-semibold text-slate-500 block">Mã ICAO</label>
                <input
                  id="new-ap-icao"
                  type="text"
                  maxLength={4}
                  placeholder="Ví dụ: VVCS"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 font-mono text-sm tracking-wider font-bold text-slate-800"
                  value={newApIcao}
                  onChange={(e) => setNewApIcao(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="new-ap-iata" className="text-xs font-semibold text-slate-500 block">Mã IATA</label>
                <input
                  id="new-ap-iata"
                  type="text"
                  maxLength={3}
                  placeholder="Ví dụ: VCS"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 font-mono text-sm tracking-wider font-bold text-slate-800"
                  value={newApIata}
                  onChange={(e) => setNewApIata(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="new-ap-region" className="text-xs font-semibold text-slate-500 block">Khu vực địa lý</label>
              <select
                id="new-ap-region"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 text-sm text-slate-700 cursor-pointer"
                value={newApRegion}
                onChange={(e) => setNewApRegion(e.target.value as any)}
              >
                <option value="Bắc">Miền Bắc</option>
                <option value="Trung">Miền Trung (Ưu tiên đầu bảng)</option>
                <option value="Nam">Miền Nam</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="new-ap-notes" className="text-xs font-semibold text-slate-500 block">Ghi chú Chỉ Dẫn (Mô tả CMS)</label>
              <textarea
                id="new-ap-notes"
                placeholder="Nhập ghi chú vận hành, bảo trì, hoặc thông tin phụ..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-3 text-sm text-slate-800"
                value={newApNotes}
                onChange={(e) => setNewApNotes(e.target.value)}
              />
            </div>

            <button
              id="submit-new-airport-btn"
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Vào Danh Sách Soạn Thảo
            </button>
          </form>
        </div>
      </div>

      {/* Main Database Table Editing Area */}
      <div className="xl:col-span-8 flex flex-col space-y-4">
        
        {/* Alerts messaging blocks */}
        {errorMsg && (
          <div id="cms-error-msg" className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-semibold text-red-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div id="cms-success-msg" className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-semibold text-emerald-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          {/* Panel title headers */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Danh Sách Soạn Thảo Cơ Sở Dữ Liệu Sân Bay</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Sắp xếp mức độ ưu tiên hàng, sếp miền Trung lên đầu danh sách</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="bulk-reset-cms-btn"
                onClick={handleResetToDefaults}
                disabled={saving}
                className="bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
                Khôi phục Mặc định
              </button>

              <button
                id="bulk-save-cms-btn"
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:bg-indigo-400 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Đang lưu...' : 'Lưu Toàn bộ Thiết lập'}
              </button>
            </div>
          </div>

          {/* Database Rows loop */}
          <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100">
            {airports.map((ap, idx) => {
              return (
                <div key={ap.id} className={`p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                  ap.enabled ? 'bg-white' : 'bg-slate-50/60 opacity-60'
                }`}>
                  {/* Sorting index & basic identity */}
                  <div className="flex items-center gap-3 w-full md:w-3/12">
                    <div className="text-xs font-mono font-bold text-slate-300 w-5 text-center">#{idx + 1}</div>
                    <div className="space-y-1 w-full">
                      <input
                        id={`input-name-${ap.id}`}
                        type="text"
                        className="bg-transparent font-bold text-sm text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none w-full py-0.5"
                        value={ap.name}
                        onChange={(e) => handleAirportChange(ap.id, 'name', e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-1.5 rounded-md inline-block">
                          {ap.icao} / {ap.iata}
                        </span>
                        <span className={`text-[10px] px-1.5 rounded-md font-bold uppercase ${
                          ap.region === 'Trung' 
                            ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                            : (ap.region === 'Bắc' ? 'bg-sky-50 border border-sky-100 text-sky-700' : 'bg-green-50 border border-green-100 text-green-700')
                        }`}>
                          Miền {ap.region}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational indicators, Custom notes input */}
                  <div className="w-full md:w-6/12 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Lưu Ý / Chỉ đạo đặc biệt (CMS)</span>
                    <input
                      id={`input-notes-${ap.id}`}
                      type="text"
                      className="text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 p-2 rounded-xl focus:outline-none w-full font-medium"
                      placeholder="Chi dẫn: Chưa cấu hình..."
                      value={ap.customNotes || ''}
                      onChange={(e) => handleAirportChange(ap.id, 'customNotes', e.target.value || undefined)}
                    />
                  </div>

                  {/* Actions & Sorting order triggers */}
                  <div className="flex items-center gap-3 w-full md:w-3/12 justify-end self-end md:self-auto">
                    {/* Toggle activation state */}
                    <button
                      id={`toggle-ap-active-${ap.id}`}
                      onClick={() => handleAirportChange(ap.id, 'enabled', !ap.enabled)}
                      title={ap.enabled ? 'Tạm ngắt giám sát' : 'Bật lại giám sát'}
                      className="text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      {ap.enabled ? (
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-xl border border-green-200">
                          <ToggleRight className="w-4 h-4 text-green-600" />
                          <span>Giám sát</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-400 text-xs px-2 py-1 rounded-xl border border-slate-200">
                          <ToggleLeft className="w-4 h-4 text-slate-350" />
                          <span>Mỏ qua</span>
                        </div>
                      )}
                    </button>

                    {/* Ordering helpers */}
                    <div className="flex gap-1">
                      <button
                        id={`btn-order-up-${ap.id}`}
                        onClick={() => moveAirport(idx, 'up')}
                        disabled={idx === 0}
                        title="Tăng thứ tự ưu tiên"
                        className="bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg p-1 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        id={`btn-order-down-${ap.id}`}
                        onClick={() => moveAirport(idx, 'down')}
                        disabled={idx === airports.length - 1}
                        title="Giảm thứ tự ưu tiên"
                        className="bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg p-1 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Delete runway */}
                    <button
                      id={`btn-delete-ap-${ap.id}`}
                      onClick={() => handleDeleteAirport(ap.id)}
                      title="Xóa sân bay khỏi hàng"
                      className="text-slate-400 hover:text-red-500 border border-slate-200 p-1.5 hover:border-red-200 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer of CMS */}
          <div className="p-3 bg-slate-50 text-center border-t border-slate-100 text-[10px] text-slate-400 font-mono font-medium">
            Phân hệ Quản trị Nội dung (VATM Meteo Content CMS) - Phiên bản đồng bộ 2.0
          </div>
        </div>
      </div>
    </div>
  );
}
