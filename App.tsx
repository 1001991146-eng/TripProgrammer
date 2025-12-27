
import React, { useState } from 'react';
import Header from './components/Header';
import TripPlannerForm from './components/TripPlannerForm';
import ItineraryView from './components/ItineraryView';
import { TripPreferences, TripResponse } from './types';
import { generateTripItinerary } from './services/geminiService';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<TripResponse | null>(null);

  const handlePlanTrip = async (prefs: TripPreferences) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateTripItinerary(prefs);
      setTripData(data);
    } catch (err: any) {
      setError(err.message || "חלה שגיאה בלתי צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTripData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!tripData ? (
          <TripPlannerForm onSubmit={handlePlanTrip} isLoading={isLoading} />
        ) : (
          <ItineraryView data={tripData} onReset={handleReset} />
        )}
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 mt-12">
        <p>© {new Date().getFullYear()} Smart Travel Planner - כל הזכויות שמורות</p>
      </footer>
    </div>
  );
};

export default App;
