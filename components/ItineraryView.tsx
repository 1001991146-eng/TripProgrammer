
import React, { useState, useRef } from 'react';
import { TripResponse, Site } from '../types';

interface Props {
  data: TripResponse;
  onReset: () => void;
}

const SiteDetails: React.FC<{ site: Site }> = ({ site }) => (
  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm print:grid-cols-3">
    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 print:bg-white print:border-gray-200">
      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold">
        <span>🌍</span>
        גאוגרפיה
      </div>
      <p className="text-emerald-900/80 leading-relaxed">{site.geography || 'מידע לא זמין'}</p>
    </div>
    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 print:bg-white print:border-gray-200">
      <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
        <span>📜</span>
        היסטוריה
      </div>
      <p className="text-amber-900/80 leading-relaxed">{site.history || 'מידע לא זמין'}</p>
    </div>
    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 print:bg-white print:border-gray-200">
      <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold">
        <span>🎭</span>
        תרבות
      </div>
      <p className="text-purple-900/80 leading-relaxed">{site.culture || 'מידע לא זמין'}</p>
    </div>
  </div>
);

const ItineraryView: React.FC<Props> = ({ data, onReset }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!itineraryRef.current) return;
    
    // Check global window object first as we loaded it via script tag in index.html
    const html2pdf = (window as any).html2pdf;
    
    if (!html2pdf) {
      console.error("html2pdf library not found on window object.");
      setFeedback("חלה שגיאה בטעינת ספריית ה-PDF. נסה להשתמש בהדפסת דפדפן (Ctrl+P).");
      return;
    }

    setIsGeneratingPDF(true);
    setFeedback("מכין את קובץ ה-PDF עבורך...");

    const element = itineraryRef.current;
    
    // Configuration for a clean Hebrew PDF
    const opt = {
      margin: [15, 10],
      filename: `itinerary_${data.tripTitle.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // Apply temporary styling for high-quality capture
      element.classList.add('pdf-capture-mode');
      
      // Small timeout to allow styles to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await html2pdf().set(opt).from(element).save();
      
      element.classList.remove('pdf-capture-mode');
      setFeedback("הקובץ הורד בהצלחה! 🎉");
    } catch (err) {
      console.error("PDF generation error:", err);
      setFeedback("חלה שגיאה ביצירת ה-PDF. נסה להשתמש באפשרות ההדפסה של הדפדפן.");
    } finally {
      setIsGeneratingPDF(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleAddToCalendar = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "").split("T")[0];
    };

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Smart Travel Planner//HE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    data.itinerary.forEach((day, index) => {
      const eventDate = new Date(tomorrow);
      eventDate.setDate(eventDate.getDate() + index);
      const dateStr = formatICSDate(eventDate);
      
      icsContent.push(
        "BEGIN:VEVENT",
        `SUMMARY:${day.title}`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `DESCRIPTION:${day.sites.map(s => s.name).join(", ")}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `trip_to_${data.tripTitle.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setFeedback("קובץ היומן יורד כעת! 📅");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `בדקו את תוכנית הטיול שלי ל${data.tripTitle.replace('תכנית טיול ל', '')}!\n${data.summary}`;
    const fullText = `${shareText}\n\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: data.tripTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Share failed:', err);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(fullText);
        setFeedback('הקישור והתקציר הועתקו ללוח! 🔗');
        setTimeout(() => setFeedback(null), 3000);
        return;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = fullText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setFeedback('הועתק ללוח! 🔗');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12 animate-fade-in relative z-10">
      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <button
          type="button"
          onClick={onReset}
          className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-2 group order-2 md:order-1 cursor-pointer bg-transparent border-none"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> תכנון טיול חדש
        </button>
        
        <div className="flex flex-wrap justify-center gap-3 order-1 md:order-2">
          <button
            type="button"
            onClick={handleShare}
            className="bg-white text-blue-600 border-2 border-blue-600 px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>🔗</span> שיתוף
          </button>

          <button
            type="button"
            onClick={handleAddToCalendar}
            className="bg-white text-indigo-600 border-2 border-indigo-600 px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>📅</span> הוספה ליומן
          </button>
          
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`bg-blue-600 text-white px-7 py-2.5 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${isGeneratingPDF ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700 hover:shadow-blue-200/50'}`}
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                מייצר PDF...
              </>
            ) : (
              <>
                <span>📄</span> הורדה כ-PDF
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-bounce text-sm font-bold border border-white/10">
          {feedback}
        </div>
      )}

      {/* Main Content Area to be Captured */}
      <div id="itinerary-content" ref={itineraryRef} className="space-y-12">
        {/* Header */}
        <div className="text-center bg-white p-10 rounded-3xl shadow-sm border border-blue-50 print:border-none print:shadow-none print:p-0">
          <h2 className="text-5xl font-black text-slate-900 mb-4">{data.tripTitle}</h2>
          <p className="text-slate-600 leading-relaxed text-xl max-w-2xl mx-auto italic">"{data.summary}"</p>
        </div>

        {/* Accommodations */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 p-8 print:shadow-none print:border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            🏨 אפשרויות לינה מומלצות
          </h3>
          <div className="grid gap-6 md:grid-cols-3 print:grid-cols-3">
            {data.accommodations?.map((acc, idx) => (
              <div key={idx} className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col h-full print:bg-white print:border-gray-200">
                <span className="text-[10px] uppercase tracking-wider font-black text-blue-600 bg-white px-2 py-1 rounded-full border border-blue-100 w-fit mb-3">
                  {acc.type}
                </span>
                <h4 className="font-bold text-blue-900 mb-2 text-lg">{acc.name}</h4>
                <p className="text-gray-600 text-sm leading-relaxed flex-grow mb-4">{acc.description}</p>
                
                <div className="mt-auto space-y-3">
                  <div className="pt-3 border-t border-blue-100 flex justify-between items-center">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-blue-400 font-bold uppercase">עלות משוערת</span>
                        <span className="font-black text-blue-800 text-lg">${acc.estimatedCost} <span className="text-xs font-normal">/ לילה</span></span>
                     </div>
                  </div>
                  {acc.bookingUrl && (
                    <a 
                      href={acc.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-xl transition-colors print:hidden"
                    >
                      הזמן עכשיו ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary */}
        <div className="space-y-12">
          {data.itinerary.map((day) => (
            <div key={day.dayNumber} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 print:shadow-none print:border-gray-200 print:break-inside-avoid">
              <div className="bg-gradient-to-l from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center print:bg-none print:text-black print:border-b-2 print:border-blue-800">
                <h3 className="text-3xl font-black">יום {day.dayNumber}: {day.title}</h3>
                <span className="text-white/60 font-bold hidden md:inline print:hidden tracking-widest text-sm uppercase">DAY {day.dayNumber}</span>
              </div>
              
              <div className="p-6 md:p-10 space-y-10">
                <div className="space-y-12">
                  {day.sites.map((site, idx) => (
                    <div key={idx} className="space-y-5 border-b border-gray-50 pb-10 last:border-none last:pb-0">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-3xl font-black text-slate-800 border-r-4 border-blue-600 pr-4 leading-tight">{site.name}</h4>
                          {site.mapUrl && (
                            <a 
                              href={site.mapUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full whitespace-nowrap print:hidden transition-colors"
                            >
                              📍 נווט במפה
                            </a>
                          )}
                        </div>
                        <p className="text-slate-700 text-lg leading-relaxed">{site.description}</p>
                      </div>

                      <SiteDetails site={site} />
                    </div>
                  ))}
                </div>

                {/* Culinary Section */}
                {day.culinaryTips && day.culinaryTips.length > 0 && (
                  <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 print:bg-white print:border-gray-200">
                    <h4 className="text-2xl font-black text-orange-800 mb-6 flex items-center gap-3">
                      <span className="bg-orange-200 p-2 rounded-xl text-xl">🍽️</span>
                      טעמים מקומיים להיום
                    </h4>
                    <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
                      {day.culinaryTips.map((tip, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                          <p className="font-bold text-orange-900 text-lg mb-1">{tip.dish}</p>
                          <p className="text-orange-700/80 text-sm leading-relaxed">{tip.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Music Section */}
        {data.musicSuggestions && data.musicSuggestions.length > 0 && (
          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl print:hidden overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
            <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
              <span className="bg-white/10 p-2 rounded-xl">🎵</span>
              פסקול לנסיעה
            </h3>
            <div className="grid gap-8 md:grid-cols-3">
              {data.musicSuggestions.map((music, idx) => (
                <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                  <h4 className="font-bold text-xl mb-2 group-hover:text-blue-400 transition-colors">{music.title}</h4>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed italic">{music.reason}</p>
                  {music.youtubeUrl && (
                    <a 
                      href={music.youtubeUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-red-900/20"
                    >
                      <span>▶</span> נגן ב-YouTube
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles for PDF and Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        /* Specific rules for html2pdf capture */
        .pdf-capture-mode {
          direction: rtl !important;
          text-align: right !important;
          padding: 15mm !important;
          background-color: white !important;
          width: 210mm !important; /* Forces A4 width during capture */
          margin: 0 auto !important;
        }
        
        .pdf-capture-mode .print-hidden, 
        .pdf-capture-mode .no-print {
          display: none !important;
        }

        .pdf-capture-mode .rounded-3xl, 
        .pdf-capture-mode .rounded-[3rem] {
          border-radius: 12px !important;
        }

        .pdf-capture-mode .shadow-md, 
        .pdf-capture-mode .shadow-lg, 
        .pdf-capture-mode .shadow-2xl {
          box-shadow: none !important;
          border: 1px solid #e2e8f0 !important;
        }
      `}} />
    </div>
  );
};

export default ItineraryView;
