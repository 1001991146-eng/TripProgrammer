
import React, { useState } from 'react';
import { Pace, TravelStyle, TripPreferences } from '../types';

interface Props {
  onSubmit: (prefs: TripPreferences) => void;
  isLoading: boolean;
}

const TripPlannerForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<TripPreferences>({
    destination: '',
    duration: 3,
    budgetPerNight: 100,
    pace: Pace.BALANCED,
    style: TravelStyle.BALANCED,
    rentCar: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-blue-50">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">לאן נוסעים?</label>
          <input
            type="text"
            required
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="למשל: פריז, טוקיו, ניו יורק..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">כמה ימים?</label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">תקציב ללילה ($)</label>
            <input
              type="number"
              min="1"
              required
              value={formData.budgetPerNight}
              onChange={(e) => setFormData({ ...formData, budgetPerNight: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">קצב הפעילות</label>
            <select
              value={formData.pace}
              onChange={(e) => setFormData({ ...formData, pace: e.target.value as Pace })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {Object.values(Pace).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">סגנון הטיול</label>
            <select
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value as TravelStyle })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {Object.values(TravelStyle).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="checkbox"
            id="rentCar"
            checked={formData.rentCar}
            onChange={(e) => setFormData({ ...formData, rentCar: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="rentCar" className="text-gray-700 font-medium">ברצוני לשכור רכב</label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-95 ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'מתכנן עבורך את הטיול...' : 'בואו נצא לדרך! ✨'}
        </button>
      </form>
    </div>
  );
};

export default TripPlannerForm;
