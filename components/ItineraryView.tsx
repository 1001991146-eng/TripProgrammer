
import React, { useState, useRef, useMemo } from 'react';
import { TripResponse, Site } from '../types';

interface Props {
  data: TripResponse;
  onReset: () => void;
}

const SiteDetails: React.FC<{ site: Site }> = ({ site }) => (
  <div className="mt-6 grid grid-cols-1 gap-6 text-sm print:grid-cols-1 print:gap-4">
    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 shadow-sm print:bg-white print:border-gray-200">
      <div className="flex items-center gap-2 mb-3 text-emerald-800 font-black text-lg">
        <span className="bg-emerald-200 p-2 rounded-lg print:bg-none print:p-0">🌍</span>
        גאוגרפיה וסביבה
      </div>
      <p className="text-emerald-900/90 leading-loose text-base whitespace-pre-line">{site.geography || 'מידע לא זמין'}</p>
    </div>
    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-100 shadow-sm print:bg-white print:border-gray-200">
      <div className="flex items-center gap-2 mb-3 text-amber-800 font-black text-lg">
        <span className="bg-amber-200 p-2 rounded-lg print:bg-none print:p-0">📜</span>
        היסטוריה ומורשת
      </div>
      <p className="text-amber-900/90 leading-loose text-base whitespace-pre-line">{site.history || 'מידע לא זמין'}</p>
    </div>
    <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-100 shadow-sm print:bg-white print:border-gray-200">
      <div className="flex items-center gap-2 mb-3 text-purple-800 font-black text-lg">
        <span className="bg-purple-200 p-2 rounded-lg print:bg-none print:p-0">🎭</span>
        תרבות ופולקלור
      </div>
      <p className="text-purple-900/90 leading-loose text-base whitespace-pre-line">{site.culture || 'מידע לא זמין'}</p>
    </div>
  </div>
);

const ItineraryView: React.FC<Props> = ({ data, onReset }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

  const sortedItinerary = useMemo(() => {
    return [...data.itinerary].sort((a, b) => a.dayNumber - b.dayNumber);
  }, [data.itinerary]);

  const handleDownloadPDF = async () => {
    if (!itineraryRef.current) return;
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      setFeedback("חלה שגיאה בטעינת ספריית ה-PDF. נסה להשתמש בהדפסת דפדפן (Ctrl+P).");
      return;
    }
    setIsGeneratingPDF(true);
    setFeedback("מכין את קובץ ה-PDF עבורך...");
    const element = itineraryRef.current;
    const opt = {
      margin: [10, 10],
      filename: `itinerary_${data.tripTitle.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    try {
      element.classList.add('pdf-capture-mode');
      await new Promise(resolve => setTimeout(resolve, 800));
      await html2pdf().set(opt).from(element).save();
      element.classList.remove('pdf-capture-mode');
      setFeedback("הקובץ הורד בהצלחה! 🎉");
    } catch (err) {
      setFeedback("חלה שגיאה ביצירת ה-PDF.");
    } finally {
      setIsGeneratingPDF(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleAddToCalendar = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatICSDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "").split("T")[0];
    let icsContent = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Smart Travel Planner//HE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    sortedItinerary.forEach((day, index) => {
      const eventDate = new Date(tomorrow);
      eventDate.setDate(eventDate.getDate() + index);
      const dateStr = formatICSDate(eventDate);
      icsContent.push("BEGIN:VEVENT", `SUMMARY:${day.title}`, `DTSTART;VALUE=DATE:${dateStr}`, `DTEND;VALUE=DATE:${dateStr}`, `DESCRIPTION:${day.sites.map(s => s.name).join(", ")}`, "STATUS:CONFIRMED", "END:VEVENT");
    });
    icsContent.push("END:VCALENDAR");
    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `trip_to_${data.tripTitle.replace(/\s+/g, '_')}.ics`);
    link.click();
    setFeedback("קובץ היומן יורד כעת! 📅");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `בדקו את תוכנית הטיול שלי ל${data.tripTitle.replace('תכנית טיול ל', '')}!\n${data.summary}`;
    const fullText = `${shareText}\n\n${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.tripTitle, text: shareText, url: shareUrl });
        return;
      } catch (err) {}
    }
    navigator.clipboard.writeText(fullText);
    setFeedback('הועתק ללוח! 🔗');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20 space-y-12 animate-fade-in relative z-10 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <button onClick={onReset} className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-2 group order-2 md:order-1 cursor-pointer bg-transparent border-none">
          <span className="group-hover:translate-x-1 transition-transform">←</span> תכנון טיול חדש
        </button>
        <div className="flex flex-wrap justify-center gap-3 order-1 md:order-2">
          <button onClick={handleShare} className="bg-white text-blue-600 border-2 border-blue-600 px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"><span>🔗</span> שיתוף</button>
          <button onClick={handleAddToCalendar} className="bg-white text-indigo-600 border-2 border-indigo-600 px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"><span>📅</span> הוספה ליומן</button>
          <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className={`bg-blue-600 text-white px-7 py-2.5 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${isGeneratingPDF ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700 hover:shadow-blue-200/50'}`}>
            {isGeneratingPDF ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> מייצר PDF...</> : <><span>📄</span> הורדה כ-PDF</>}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-bounce text-sm font-bold border border-white/10">{feedback}</div>
      )}

      <div id="itinerary-content" ref={itineraryRef} className="space-y-12">
        <div className="text-center bg-white p-10 rounded-3xl shadow-sm border border-blue-50 print:border-none print:shadow-none print:p-0">
          <h2 className="text-5xl font-black text-slate-900 mb-4 leading-tight">{data.tripTitle}</h2>
          <p className="text-slate-600 leading-relaxed text-xl max-w-3xl mx-auto italic">"{data.summary}"</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 p-8 print:shadow-none print:border-gray-200">
          <h3 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3 border-b border-gray-100 pb-4">🏨 המלצות לינה ואירוח</h3>
          <div className="grid gap-6 md:grid-cols-3 print:grid-cols-3">
            {data.accommodations?.map((acc, idx) => (
              <div key={idx} className="bg-blue-50/40 p-6 rounded-3xl border border-blue-100 flex flex-col h-full print:bg-white print:border-gray-200">
                <span className="text-[10px] uppercase tracking-widest font-black text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-100 w-fit mb-4 shadow-sm">{acc.type}</span>
                <h4 className="font-black text-blue-900 mb-3 text-xl">{acc.name}</h4>
                <p className="text-gray-600 text-sm leading-relaxed flex-grow mb-6">{acc.description}</p>
                <div className="mt-auto space-y-4">
                  <div className="pt-4 border-t border-blue-100 flex justify-between items-center">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">עלות משוערת</span>
                        <span className="font-black text-blue-800 text-2xl">${acc.estimatedCost} <span className="text-xs font-normal">/ לילה</span></span>
                     </div>
                  </div>
                  {acc.bookingUrl && <a href={acc.bookingUrl} target="_blank" rel="noopener noreferrer" className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-2xl transition-all shadow-md active:scale-95 print:hidden">להזמנה ובדיקת זמינות ↗</a>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-16">
          {sortedItinerary.map((day) => (
            <div key={day.dayNumber} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 print:shadow-none print:border-gray-200 print:break-inside-avoid">
              <div className="bg-gradient-to-l from-blue-700 to-indigo-800 text-white p-8 flex justify-between items-center print:bg-none print:text-black print:border-b-4 print:border-blue-900">
                <h3 className="text-4xl font-black">יום {day.dayNumber}: {day.title}</h3>
                <div className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/20 hidden md:block">
                  <span className="text-white/80 font-black tracking-widest text-sm uppercase">יום {day.dayNumber} מתוך {sortedItinerary.length}</span>
                </div>
              </div>
              
              <div className="p-8 md:p-12 space-y-12">
                {day.sites.map((site, idx) => (
                  <div key={idx} className="space-y-8 border-b border-gray-100 pb-16 last:border-none last:pb-0">
                    <div className="flex flex-col gap-10">
                      <div className="flex flex-col md:flex-row gap-10">
                        {site.imageUrl && (
                          <div className="w-full md:w-2/5 flex-shrink-0">
                            <div className="relative group overflow-hidden rounded-[2rem] shadow-2xl aspect-[16/10]">
                              <img src={site.imageUrl} alt={site.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                              <div className="absolute bottom-6 right-6 text-white font-black text-xl drop-shadow-lg">{site.name}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex-grow space-y-6">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-4xl font-black text-slate-800 border-r-8 border-blue-600 pr-6 leading-tight">{site.name}</h4>
                            {site.mapUrl && <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-6 py-3 rounded-2xl whitespace-nowrap print:hidden transition-all shadow-sm active:scale-95">📍 פתח במפה</a>}
                          </div>
                          <p className="text-slate-700 text-xl leading-relaxed font-medium">{site.description}</p>
                        </div>
                      </div>
                      <SiteDetails site={site} />
                    </div>
                  </div>
                ))}

                {day.culinaryTips && day.culinaryTips.length > 0 && (
                  <div className="mt-8 bg-gradient-to-br from-orange-50 to-amber-50 p-10 rounded-[2.5rem] border border-orange-100 shadow-inner print:bg-white print:border-gray-200">
                    <h4 className="text-3xl font-black text-orange-900 mb-8 flex items-center gap-4"><span className="bg-orange-200 p-3 rounded-2xl text-2xl shadow-sm">🥘</span> טעמים מקומיים והסברים</h4>
                    <div className="grid gap-8 md:grid-cols-2 print:grid-cols-1">
                      {day.culinaryTips.map((tip, idx) => (
                        <div key={idx} className="bg-white p-7 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                          <p className="font-black text-orange-800 text-2xl mb-3">{tip.dish}</p>
                          <p className="text-orange-950/80 text-lg leading-relaxed whitespace-pre-line">{tip.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.musicSuggestions && data.musicSuggestions.length > 0 && (
          <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl print:hidden overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent)] pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-4xl font-black mb-10 flex items-center gap-4"><span className="bg-white/10 p-3 rounded-2xl text-2xl">🎶</span> פסקול מקומי מומלץ לטיול</h3>
              <div className="grid gap-10 md:grid-cols-3">
                {data.musicSuggestions.map((music, idx) => (
                  <div key={idx} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group flex flex-col h-full text-right">
                    <h4 className="font-black text-2xl mb-3 group-hover:text-blue-400 transition-colors">{music.title}</h4>
                    <p className="text-slate-400 text-base mb-8 leading-relaxed italic flex-grow">"{music.reason}"</p>
                    {music.youtubeUrl && <a href={music.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-red-900/40"><span className="text-lg">▶</span> חיפוש ב-YouTube</a>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .pdf-capture-mode { direction: rtl !important; text-align: right !important; padding: 10mm !important; background-color: white !important; width: 210mm !important; margin: 0 auto !important; }
        .pdf-capture-mode .print-hidden { display: none !important; }
        .pdf-capture-mode img { border-radius: 12mm !important; max-width: 100% !important; height: auto !important; }
        .pdf-capture-mode .rounded-[2.5rem], .pdf-capture-mode .rounded-[3.5rem] { border-radius: 8mm !important; }
      `}} />
    </div>
  );
};

export default ItineraryView;
