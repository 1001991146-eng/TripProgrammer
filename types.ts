
export enum Pace {
  RELAXED = 'רגוע',
  BALANCED = 'מאוזן',
  INTENSIVE = 'אינטנסיבי'
}

export enum TravelStyle {
  BALANCED = 'מאוזן',
  CULTURE = 'תרבות',
  EXTREME = 'אקסטרים',
  CULINARY = 'קולינרי',
  LUXURY = 'יוקרה',
  BACKPACKING = 'תרמילאים'
}

export interface TripPreferences {
  destination: string;
  duration: number;
  budgetPerNight: number;
  pace: Pace;
  style: TravelStyle;
  rentCar: boolean;
}

export interface Site {
  name: string;
  description: string;
  geography: string;
  history: string;
  culture: string;
  transportMethod: string;
  mapUrl: string;
}

export interface CulinaryRecommendation {
  dish: string;
  description: string;
}

export interface Accommodation {
  name: string;
  type: string;
  description: string;
  priceNote: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  sites: Site[];
  culinaryTips: CulinaryRecommendation[];
}

export interface MusicSuggestion {
  title: string;
  reason: string;
  youtubeUrl: string;
}

export interface TripResponse {
  tripTitle: string;
  summary: string;
  itinerary: ItineraryDay[];
  accommodations: Accommodation[];
  musicSuggestions: MusicSuggestion[];
}
