/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ParsedWeather } from '../types';
import { Sparkles, Loader2, Send, Bot, ShieldAlert, CheckCircle, Navigation, Play, AlertTriangle } from 'lucide-react';

interface AiBriefingProps {
  weatherData: ParsedWeather[];
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function AiBriefing({ weatherData }: AiBriefingProps) {
  const [briefResponse, setBriefResponse] = useState<string>('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadedBriefTime, setLoadedBriefTime] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive copilot Q&A
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Xin chào phi công! Tôi là Trợ Lý Khí Tượng Hàng Không AI. Bạn cần tra cứu thời tiết đặc thù, phân tích rủi ro hạ cánh hay giải nghĩa các thuật ngữ nào?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Rule-based fallback summary when no AI backend is available (e.g., Vercel / Static Github deployment)
  const generateLocalBriefing = (data: ParsedWeather[]): string => {
    const total = data.length;
    const alerts = data.filter(w => w.isAlert);
    
    const vvdn = data.find(w => w.icao === 'VVDN');
    const vvca = data.find(w => w.icao === 'VVCA');
    const vvpc = data.find(w => w.icao === 'VVPC');
    const vvpk = data.find(w => w.icao === 'VVPK');
    
    const centralAirports = [
      { name: 'Đà Nẵng', icao: 'VVDN', item: vvdn },
      { name: 'Chu Lai', icao: 'VVCA', item: vvca },
      { name: 'Phù Cát', icao: 'VVPC', item: vvpc },
      { name: 'Pleiku', icao: 'VVPK', item: vvpk }
    ].filter(a => a.item);

    const highTemp = data.filter(w => w.temp >= 36);
    const lowVis = data.filter(w => w.visibilityM < 5000);
    const extremePhen = data.filter(w => w.isExtremePhenomena);

    let report = `### 📝 BÁO CÁO PHÂN TÍCH KHÍ TƯỢNG HÀNG KHÔNG QUY CHUẨN (LOCAL FALLBACK)

*(Bản tin dịch tự động do hệ thống đang chạy trên máy chủ tĩnh Vercel/GitHub)*

## 1. Phân Tích Khí Tượng Tổng Quan (Miền Trung Trọng Điểm)
- Hệ thống đang giám sát thời gian thực **${total}** sân bay Việt Nam. Có **${alerts.length}/${total}** trạm đang kích hoạt cảnh báo rủi ro sụt giảm chất lượng bay.
- Diễn biến cụ thể tại các sân bay trọng tâm Miền Trung:
`;

    if (centralAirports.length > 0) {
      centralAirports.forEach(a => {
        report += `  - **Sân bay ${a.name} (${a.icao})**: Nhiệt độ ${a.item!.temp}°C, gió hướng ${a.item!.windDir} tốc độ ${a.item!.windSpeed}m/s. Tầm nhìn ngang đạt ${a.item!.visibility}. Trần mây: ${a.item!.clouds}. ${a.item!.phenomena !== 'Bình thường (Bầu trời trong)' ? `Hiện tượng: ${a.item!.phenomena}.` : 'Thời tiết quang đãng.'}\n`;
      });
    } else {
      report += `  - Sân bay Đà Nẵng, Chu Lai, Phù Cát, Pleiku tạm thời chưa truyền phát bản tin METAR mới.\n`;
    }

    report += `
## 2. Cảnh Báo Rủi Ro Khí Tượng Hàng Không (Hazards)
`;

    if (highTemp.length > 0) {
      report += `- **Nắng nóng cực đoan (Nhiệt >= 36°C)**: Kích hoạt cảnh báo rủi ro nhiệt động lực học tại các trạm bay: ${highTemp.map(w => `**${w.icao}** (${w.temp}°C)`).join(', ')}. Khuyến cáo tổ bay kiểm soát mật độ phân luồng lực nâng cánh tàu bay khi chạy đà cất cánh kéo dài.\n`;
    } else {
      report += `- **Rủi ro nhiệt độ**: Trực quan nhiệt lượng ổn định dưới ngưỡng 36°C tại tất cả trạm quan trắc. Động cơ lực nâng vận hành an toàn.\n`;
    }

    if (lowVis.length > 0) {
      report += `- **Tầm nhìn suy giảm (Vis < 5km)**: Ghi nhận hạn chế quan trắc giảm tầm nhìn phi đạo tại: ${lowVis.map(w => `**${w.icao}** (${w.visibility})`).join(', ')}. Khuyến nghị tổ lái chuẩn bị phương án ILS thiết bị hỗ trợ hoặc bay vòng tiếp cận.\n`;
    } else {
      report += `- **Chất lượng tầm nhìn**: Cự ly nhìn xa thông suốt rực rỡ (>5km). Cực kỳ thích ứng cho điều kiện cất hạ cánh tiếp cận trực giác (VFR).\n`;
    }

    if (extremePhen.length > 0) {
      report += `- **Hiện tượng cực đoan (TS/RA...)**: Cảnh báo hoạt dông dông sét, mưa rào hoặc mù dốc che tầm khống chế bay lân cận vùng: ${extremePhen.map(w => `**${w.icao}** (${w.phenomena})`).join(', ')}. Tránh xuyên tâm mây tích điện (CB).\n`;
    } else {
      report += `- **Thời tiết nguy hiểm**: Chưa xuất hiện ổ dông dột kích hoặc hiện tượng dốc mưa cắt dứt làm xáo trộn gia tốc bề mặt.\n`;
    }

    report += `
## 3. Khuyến Cáo Cho Tổ Bay & Đơn Vị Điều Hành (Advice)
- **Tổ bay (Phi công)**: 
  - Đề phòng bất ổn gió bề mặt (Windshear) tại Pleiku độ cao lớn và Đà Nẵng hành lang sát biển Quảng Nam.
  - Luôn nạp dôi dư khoảng 15-20 phút dầu nhiên liệu dự bị tiếp xúc đường băng chờ hạ cánh khi gặp mưa dông bất chợt.
- **Kỹ thuật không lưu**:
  - Đo đạc liên tiếp và nhanh nhất áp suất QNH cục bộ để bảo đảm máy đo độ cao áp suất tàu bay hoạt động chuẩn khít tuyệt đối.`;

    return report;
  };

  const generateLocalChatResponse = (text: string, data: ParsedWeather[]): string => {
    const query = text.toLowerCase().trim();
    const mainAps = [
      { name: 'Đà Nẵng', icao: 'VVDN' },
      { name: 'Chu Lai', icao: 'VVCA' },
      { name: 'Phù Cát', icao: 'VVPC' },
      { name: 'Pleiku', icao: 'VVPK' },
      { name: 'Tân Sơn Nhất', icao: 'VVTS' },
      { name: 'Nội Bài', icao: 'VVNB' },
    ];
    
    const matched = mainAps.find(ap => query.includes(ap.icao.toLowerCase()) || query.includes(ap.name.toLowerCase()));
    if (matched) {
      const w = data.find(item => item.icao.toUpperCase() === matched.icao);
      if (w) {
        return `### 📊 Thống kê Khí tượng nhanh: **Sân bay ${matched.name} (${matched.icao})**\n\n- **Thời gian quan trắc**: ${w.localTimeDisplay || 'N/A'}\n- **Nhiệt độ hành lang**: ${w.temp}°C, điểm sương ${w.dewPoint}°C (Độ ẩm: ${w.humidity}%)\n- **Gió bề mặt**: Hướng ${w.windDir}, tốc độ ${w.windSpeed} m/s (xấp xỉ ${w.windSpeedKt} knots)\n- **Tầm nhìn ngang**: ${w.visibility}\n- **Trần mây hiện tại**: ${w.clouds}\n- **Khí áp quy chuẩn QNH**: ${w.pressure} hPa\n- **Trạng thái cảnh báo**: ${w.isAlert ? `⚠️ **CHÚ Ý** (${w.alertReasons.join('; ')})` : '✅ **Bảo đảm an toàn tiêu chuẩn, không có cảnh báo rủi ro nào.**.'}`;
      }
    }

    if (query.includes('hiển thị') || query.includes('mâu') || query.includes('mây') || query.includes('few') || query.includes('sct') || query.includes('bkn') || query.includes('ovc')) {
      return `### ☁️ Quy chuẩn quốc tế ICAO giải nghĩa mức che phủ mây:\n\n- **FEW**: Mây thưa (1/8 - 2/8 bầu trời bị che phủ)\n- **SCT**: Mây rải rác (3/8 - 4/8 bầu trời bị che phủ)\n- **BKN**: Mây nhiều / Trần mây (5/8 - 7/8 bầu trời bị che phủ) -> Kích hoạt ghi nhận trần mây khống chế bay.\n- **OVC**: Mây u ám / Kín trời (8/8 bầu trời bị che hoàn toàn)\n\n*Trần mây (Ceiling) thấp yêu cầu phi công phải bay bằng thiết bị dẫn đường ILS tuyệt đối để bảo toàn cự ly tiếp cận phi đạo.*`;
    }

    if (query.includes('gió') || query.includes('wind')) {
      const highWind = [...data].sort((a,b) => b.windSpeed - a.windSpeed)[0];
      return `### 💨 Phân tích hệ thống gió bề mặt sân bay:\n\n- Tốc độ gió mặt đất mạnh nhất hiện tại ở trạm: **${highWind ? `${highWind.windSpeed} m/s (${highWind.windSpeedKt} knots)` : 'N/A'}** tại sân bay **${highWind ? highWind.icao : 'chưa rõ'}**.\n- Hướng gió và vận tốc gió giật (Wind Gust) có ảnh hưởng quyết định đến thành phần gió xuôi hay cắt ngang cánh bay. Phi công hãy lựa chọn đúng hướng runway ngược gió để có hành trình cất hạ cánh ngắn nhất.`;
    }

    if (query.includes('nhiệt độ') || query.includes('temp') || query.includes('nóng')) {
      const highTemp = [...data].sort((a,b) => b.temp - a.temp)[0];
      return `### 🌡️ Phân tích nền nhiệt độ khí quyển:\n\n- Trạm quan trắc ghi nhận mức nhiệt cao nhất: **${highTemp ? `${highTemp.temp}°C` : 'N/A'}** tại sân bay **${highTemp ? highTemp.icao : 'N/A'}**.\n- **Chú ý rủi ro**: Chênh lệch nhiệt độ khí quyển lớn làm loãng mật độ không khí, dẫn đến lực đẩy và lực nâng tàu bay giảm. Nhiệt độ trên 36°C (chữ màu đỏ đậm) sẽ lập tức kích hoạt cảnh báo đặc biệt trên giao diện giám sát khí tượng hàng không VN.`;
    }

    return `### ✈️ Nhật ký Trợ lý Co-Pilot Khí tượng (Local Simulator Mode)\n\nTôi đang phân tích cơ sở dữ liệu METAR thời gian thực gồm **${data.length}** sân bay.\n\nBạn có thể hỏi bất kỳ câu hỏi nào:\n1. Để tra cứu nhanh một trạm, gõ trực tiếp tên sân bay hoặc mã ICAO tương ứng (Ví dụ: "Đà Nẵng", "VVDN", "Tân Sơn Nhất" hay "vvts").\n2. Hỏi chuyên sâu về các thuật ngữ hàng không như: "gió", "mây", "nhiệt độ" để tôi tóm tắt quy chuẩn ICAO tức thì!\n\n*(Lưu ý: Bạn đang chạy trên Vercel không có server-side Node, tôi đã tự động khởi động lõi phiên dịch khí tượng client để đồng hành cùng bạn)*`;
  };

  // Generate automated AMC weather summary briefing
  const handleGenerateBriefing = async () => {
    setLoadingBrief(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherData })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setBriefResponse(result.summaryText);
        setLoadedBriefTime(result.lastUpdated || new Date().toLocaleTimeString('vi-VN'));
      } else {
        throw new Error(result.message || 'Lỗi không xác định khi tạo bản tin.');
      }
    } catch (err: any) {
      console.warn('Backend Gemini API fails (maybe Vercel offline/no proxy). Activating Local Meteorologist agent backup.', err);
      // Seamless rule-based fallback
      const reportText = generateLocalBriefing(weatherData);
      setBriefResponse(reportText);
      setLoadedBriefTime(`${new Date().toLocaleTimeString('vi-VN')} (Cục bộ)`);
    } finally {
      setLoadingBrief(false);
    }
  };

  // Submit question to AI Assistant
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setLoadingChat(true);

    try {
      // Craft a temporary prompt utilizing current meteorological tables
      const simplifiedWeather = weatherData.map(w => `${w.icao}: ${w.temp}°C, Gió: ${w.windDir} - ${w.windSpeed}m/s, Tầm nhìn: ${w.visibility}, Mây: ${w.clouds}, HTTT: ${w.phenomena}`).join("\n");
      
      const prompt = `
Bạn là Trợ lý Khí tượng Hàng không Việt Nam (AMC Co-Pilot AI).
Dưới đây là bảng thời tiết sân bay hiện tại thời gian thực:
${simplifiedWeather}

Hãy trả lời câu hỏi sau của phi công hoặc điều hành viên một cách chính xác, chu đáo, súc tích bằng Tiếng Việt. Tập trung tối đa vào thông số khí tượng hàng không, độ cao mây, gió giật, độ cao trần mây cất cánh, hạ cánh an toàn.

Câu hỏi của phi công: "${userText}"
`;

      const chatResponse = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weatherData,
          promptOverride: prompt 
        })
      });

      if (!chatResponse.ok) {
        throw new Error(`HTTP Error Status: ${chatResponse.status}`);
      }

      const chatResult = await chatResponse.json();
      if (chatResult.success) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: chatResult.summaryText }]);
      } else {
        throw new Error(chatResult.message || 'Lỗi không xác định.');
      }
    } catch (err: any) {
      console.warn('Gemini Chat fails, initiating offline rule intelligence answer.', err);
      const answer = generateLocalChatResponse(userText, weatherData);
      setChatMessages(prev => [...prev, { sender: 'ai', text: answer }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
      
      {/* Flight Safety Summary Panel */}
      <div className="xl:col-span-7 flex flex-col space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Bản Phân Tích Tổng Hợp Khí Tượng (AI Briefing)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tự động tổng hợp dữ liệu thời tiết thực tại các sân bay VN bằng AI</p>
                </div>
              </div>

              {loadedBriefTime && (
                <span className="text-[10px] font-mono text-slate-400">
                  Cập nhật: {loadedBriefTime}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 p-3 rounded-xl text-xs text-red-800 flex items-start gap-1.5 font-semibold">
                <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Empty summary state or results */}
            {!briefResponse ? (
              <div className="text-center py-10 px-4 space-y-3 max-w-sm mx-auto">
                <Bot className="w-12 h-12 text-slate-350 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Báo cáo Khí tượng Hàng không</h4>
                <p className="text-xs text-slate-400">Trích xuất nhanh các rủi ro vận hành bay mặt đất, dông sét (TS), gió giật mạnh dựa trên điều kiện thời tiết thực.</p>
                <button
                  id="btn-trigger-ai-briefing"
                  onClick={handleGenerateBriefing}
                  disabled={loadingBrief}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 w-full cursor-pointer disabled:bg-indigo-400"
                >
                  <Play className="w-3.5 h-3.5" />
                  Bắt đầu Phân tích (Sử dụng AI)
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl shadow-inner max-h-[360px] overflow-y-auto text-xs text-slate-705 leading-relaxed font-medium font-sans">
                {/* Parse Markdown summaries */}
                <div className="prose prose-xs text-slate-800 whitespace-pre-line space-y-3">
                  {briefResponse}
                </div>
              </div>
            )}
          </div>

          {briefResponse && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                id="btn-re-generate-briefing"
                onClick={handleGenerateBriefing}
                disabled={loadingBrief}
                className="bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {loadingBrief ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                Tạo lại bản tin thời tiết
              </button>
            </div>
          )}

          {/* Loading Screen Overlay with Aviation messages */}
          {loadingBrief && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Trí tuệ nhân tạo đang phân tích...</h4>
                  <p className="text-xs text-slate-500">Đang dịch chỉ số METAR, giải nghĩa hướng gió đứt, rà soát ngưỡng dông sét & dán thẻ cảnh báo bay.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-800 rounded-xl p-3 text-[11px] italic font-medium leading-normal">
                  "Trong thời gian chờ, phi hành đoàn lưu ý rà soát lại trọng lượng cất hạ cánh nếu nhiệt độ cao tại miền Trung vượt quy định 36°C."
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* AI Assistant Chat Section */}
      <div className="xl:col-span-5 flex flex-col space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col h-[480px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 shrink-0">
            <Bot className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Trợ lý Hỏi Đáp Khí Tượng AI</h3>
              <p className="text-[10px] text-slate-405">Chatbot tư vấn tiêu chuẩn METAR & rủi ro an toàn</p>
            </div>
          </div>

          {/* Chat history content loop */}
          <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`p-2.5 rounded-2xl text-xs leading-relaxed font-semibold transition-all ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="flex gap-2 mr-auto items-center text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Trợ lý AMC đang tra cứu khí tượng...</span>
              </div>
            )}
          </div>

          {/* Prompt typing input form */}
          <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t border-slate-100 pt-3">
            <input
              id="ai-chat-input-field"
              type="text"
              placeholder="Hỏi AI: ý nghĩa CAVOK, bão Cam Ranh, sương mù..."
              className="flex-grow bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loadingChat}
            />
            <button
              id="chat-send-btn"
              type="submit"
              disabled={loadingChat || !chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-2 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
