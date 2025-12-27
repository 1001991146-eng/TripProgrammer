
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TripPlannerForm from './components/TripPlannerForm';
import ItineraryView from './components/ItineraryView';
import { TripPreferences, TripResponse } from './types';
import { generateTripItinerary } from './services/geminiService';

const LOADING_STEPS = [
  "מנתח את היעד המבוקש...",
  "מחפש את האתרים המעניינים ביותר...",
  "בוחר המלצות לינה בתקציב שלך...",
  "מתאים את קצב הטיול להעדפותיך...",
  "אוצר חוויות קולינריות מקומיות...",
  "מכין את פלייליסט הנסיעה המושלם...",
  "מייצר את המסלול הסופי...",
  "מפיק תמונות מרהיבות של היעדים..."
];

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<TripResponse | null>(null);

  useEffect(() => {
    let interval: any;
    let timerInterval: any;

    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 4000);

      timerInterval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingStep(0);
      setElapsedTime(0);
    }

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [isLoading]);

  const handlePlanTrip = async (prefs: TripPreferences) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep(0);
    setElapsedTime(0);
    try {
      const data = await generateTripItinerary(prefs);
      setTripData(data);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "חלה שגיאה בלתי צפויה בתהליך התכנון.";
      setError(errorMessage);
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
          <div className="max-w-2xl mx-auto mb-8 bg-white border-2 border-red-100 p-6 rounded-3xl shadow-xl animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-2xl text-red-600 text-3xl">
                ⚠️
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900">אופס! משהו השתבש בתכנון</h3>
                <p className="text-slate-600 leading-relaxed">
                  הבינה המלאכותית נתקלה בקושי בזמן בניית המסלול עבורך.
                </p>
                <div className="bg-red-50/50 p-3 rounded-xl border border-red-50 text-red-800 text-sm font-medium">
                  <strong>פרטי השגיאה:</strong> {error}
                </div>
                
                <div className="pt-2">
                  <p className="font-bold text-slate-800 mb-2">פעולות מומלצות לפתרון:</p>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
                    <li>וודאו שחיבור האינטרנט שלכם יציב ותקין.</li>
                    <li>אם קיבלתם שגיאת זמן (Timeout), ייתכן שהשרת עמוס - נסו שוב בעוד רגע.</li>
                    <li>נסו לקצר את משך הטיול או לבחור יעד נפוץ יותר.</li>
                    <li>רעננו את הדף ונסו מחדש.</li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => setError(null)}
                  className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg active:scale-95"
                >
                  הבנתי, בואו ננסה שוב
                </button>
              </div>
            </div>
          </div>
        )}

        {!tripData ? (
          <div className="relative">
            <TripPlannerForm onSubmit={handlePlanTrip} isLoading={isLoading} />
            
            {isLoading && (
              <div className="mt-8 max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full font-bold text-xl shadow-inner border transition-colors ${elapsedTime > 60 ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                    {elapsedTime}s
                  </div>
                  <p className="text-sm text-gray-400 font-medium">זמן שחלף</p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner border border-gray-100">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-700 h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                    style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  ></div>
                </div>
                
                <div className="text-center">
                  <p className="text-blue-800 font-black animate-pulse text-xl mb-1">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                  {elapsedTime > 35 && (
                    <p className="text-orange-600 text-sm font-bold animate-bounce mt-2">
                      אנחנו גם מייצרים עבורך תמונות מרהיבות של המקומות, זה דורש מעט סבלנות...
                    </p>
                  )}
                  <p className="text-gray-400 text-sm italic mt-1">
                    הבינה המלאכותית מעבדת את הבקשה ומחפשת את המידע העדכני ביותר.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ItineraryView data={tripData} onReset={handleReset} />
        )}
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100 mt-12 print:hidden">
        <p>© {new Date().getFullYear()} Smart Travel Planner - מיוצר באהבה עבור המטייל הישראלי</p>
      </footer>
    </div>
  );
};

export default App;
