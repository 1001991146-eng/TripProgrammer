
import React from 'react';
import { TripResponse, Site } from '../types';

interface Props {
  data: TripResponse;
  onReset: () => void;
}

const SiteDetails: React.FC<{ site: Site }> = ({ site }) => (
  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold">
        <span>🌍</span>
        גאוגרפיה
      </div>
      <p className="text-emerald-900/80 leading-relaxed">{site.geography}</p>
    </div>
    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
      <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
        <span>📜</span>
        היסטוריה
      </div>
      <p className="text-amber-900/80 leading-relaxed">{site.history}</p>
    </div>
    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
      <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold">
        <span>🎭</span>
        תרבות
      </div>
      <p className="text-purple-900/80 leading-relaxed">{site.culture}</p>
    </div>
  </div>
);

const ItineraryView: React.FC<Props> = ({ data, onReset }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
        <h2 className="text-4xl font-black text-gray-800 mb-4">{data.tripTitle}</h2>
        <p className="text-gray-600 leading-relaxed text-lg max-w-2xl mx-auto">{data.summary}</p>
        <button
          onClick={onReset}
          className="mt-6 text-blue-600 font-bold hover:underline transition-all"
        >
          ← תכנון טיול חדש
        </button>
      </div>

      {/* Accommodations Section */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🏨 איפה לישון?
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {data.accommodations.map((acc, idx) => (
            <div key={idx} className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col h-full hover:shadow-lg transition-shadow">
              <div className="mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-white px-2 py-1 rounded-md border border-blue-100">
                  {acc.type}
                </span>
              </div>
              <h4 className="font-bold text-lg text-blue-900 mb-2">{acc.name}</h4>
              <p className="text-gray-700 text-sm flex-grow leading-relaxed">{acc.description}</p>
              <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center">
                <span className="text-blue-800 font-bold text-sm">{acc.priceNote}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Itinerary Section */}
      <div className="space-y-8">
        {data.itinerary.map((day) => (
          <div key={day.dayNumber} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100">
            <div className="bg-blue-600 text-white p-5 flex justify-between items-center">
              <h3 className="text-2xl font-bold">יום {day.dayNumber}: {day.title}</h3>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
              {/* Sites Section */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-gray-800 border-r-4 border-blue-500 pr-3">מה עושים היום?</h4>
                <div className="grid gap-6">
                  {day.sites.map((site, idx) => (
                    <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h5 className="text-xl font-bold text-blue-700">{site.name}</h5>
                            <a 
                              href={site.mapUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 font-medium hover:underline text-sm flex items-center gap-1"
                            >
                              📍 נווט במפה
                            </a>
                          </div>
                          <p className="text-gray-800 leading-relaxed font-medium">{site.description}</p>
                          <div className="inline-block bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-600 text-sm">
                            🚇 {site.transportMethod}
                          </div>
                        </div>

                        {/* Expanded Info Cards */}
                        <SiteDetails site={site} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Culinary Section */}
              <div className="bg-orange-50 p-6 rounded-2xl">
                <h4 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                  🍽️ טעמים מקומיים
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {day.culinaryTips.map((tip, idx) => (
                    <div key={idx} className="bg-white/50 p-4 rounded-xl border border-orange-100">
                      <p className="font-bold text-orange-900">{tip.dish}</p>
                      <p className="text-orange-700 text-sm leading-relaxed">{tip.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Music Section */}
      <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          🎵 פסקול לטיול
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {data.musicSuggestions.map((music, idx) => (
            <div key={idx} className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/20">
              <h4 className="font-bold text-lg mb-2">{music.title}</h4>
              <p className="text-indigo-100 text-sm mb-4">{music.reason}</p>
              <a 
                href={music.youtubeUrl.startsWith('http') ? music.youtubeUrl : `https://www.youtube.com/results?search_query=${encodeURIComponent(music.youtubeUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95"
              >
                צפייה ב-YouTube
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItineraryView;
