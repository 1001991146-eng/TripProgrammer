
import { GoogleGenAI, Type } from "@google/genai";
import { TripPreferences, TripResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateTripItinerary = async (prefs: TripPreferences): Promise<TripResponse> => {
  const prompt = `
    צור תכנית טיול מפורטת ועשירה עבור היעד: ${prefs.destination}.
    פרטי הבקשה:
    - משך הטיול: ${prefs.duration} ימים.
    - תקציב ללילה: ${prefs.budgetPerNight} דולר.
    - קצב הפעילות: ${prefs.pace}.
    - סגנון הטיול: ${prefs.style}.
    - השכרת רכב: ${prefs.rentCar ? 'כן' : 'לא'}.

    דרישות ספציפיות להרחבת המידע:
    1. עבור כל אתר בתוכנית היומית, ספק מידע מעמיק בשלושה היבטים:
       - גאוגרפיה: הסבר על המיקום הפיזי, הנוף או המבנה הגאולוגי/אורבני.
       - היסטוריה: רקע היסטורי מרתק, אירועים מרכזיים או סיפור הקמת המקום.
       - תרבות: חשיבות תרבותית, מנהגים מקומיים הקשורים לאתר או אווירה ייחודית.
    2. המלצות קולינריות ייחודיות ודרכי הגעה מפורטות.
    3. לפחות 3 אפשרויות לינה המתאימות לתקציב ולסגנון.
    4. הצעות למוזיקה ביוטיוב (קישורים או שאילתות) שמתאימות לאווירת היעד.
    
    התגובה חייבת להיות בעברית רהוטה ובפורמט JSON בלבד.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tripTitle: { type: Type.STRING },
          summary: { type: Type.STRING },
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayNumber: { type: Type.NUMBER },
                title: { type: Type.STRING },
                sites: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      geography: { type: Type.STRING },
                      history: { type: Type.STRING },
                      culture: { type: Type.STRING },
                      transportMethod: { type: Type.STRING },
                      mapUrl: { type: Type.STRING }
                    },
                    required: ["name", "description", "geography", "history", "culture", "transportMethod", "mapUrl"]
                  }
                },
                culinaryTips: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dish: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["dish", "description"]
                  }
                }
              },
              required: ["dayNumber", "title", "sites", "culinaryTips"]
            }
          },
          accommodations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                priceNote: { type: Type.STRING }
              },
              required: ["name", "type", "description", "priceNote"]
            }
          },
          musicSuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                reason: { type: Type.STRING },
                youtubeUrl: { type: Type.STRING }
              },
              required: ["title", "reason", "youtubeUrl"]
            }
          }
        },
        required: ["tripTitle", "summary", "itinerary", "accommodations", "musicSuggestions"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("חלה שגיאה בעיבוד נתוני הטיול. אנא נסה שוב.");
  }
};
