
import { GoogleGenAI, Type } from "@google/genai";
import { TripPreferences, TripResponse } from "../types";

export const generateTripItinerary = async (prefs: TripPreferences): Promise<TripResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  // Create an AbortController to handle timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

  const prompt = `
    צור תכנית טיול מפורטת ומרתקת ליעד: ${prefs.destination}.
    פרמטרים: ${prefs.duration} ימים, תקציב ${prefs.budgetPerNight}$, קצב ${prefs.pace}, סגנון ${prefs.style}.
    
    הנחיות חשובות:
    1. החזר את התשובה בעברית בלבד.
    2. היה תמציתי אך איכותי כדי להבטיח מהירות תגובה.
    3. עבור המלונות, ציין עלות משוערת ללילה בדולרים וקישור תקין להזמנה.
    4. וודא שה-JSON תקני ומלא.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Disable thinking budget to ensure maximum speed (latency-focused)
        thinkingConfig: { thinkingBudget: 0 },
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
                  dayNumber: { type: Type.INTEGER },
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
                        mapUrl: { type: Type.STRING }
                      },
                      required: ["name", "description"]
                    }
                  },
                  culinaryTips: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dish: { type: Type.STRING },
                        description: { type: Type.STRING }
                      }
                    }
                  }
                },
                required: ["dayNumber", "title", "sites"]
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
                  priceNote: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER },
                  bookingUrl: { type: Type.STRING }
                },
                required: ["name", "estimatedCost", "bookingUrl"]
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
                }
              }
            }
          },
          required: ["tripTitle", "summary", "itinerary", "accommodations"]
        }
      }
    });

    clearTimeout(timeoutId);

    if (!response || !response.text) {
      throw new Error("לא התקבלה תשובה מהשרת.");
    }

    const data = JSON.parse(response.text);
    return data as TripResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("החיבור התנתק עקב המתנה ארוכה מדי (Timeout). אנא נסו שוב.");
    }
    console.error("Gemini API Error details:", error);
    throw new Error(error.message || "חלה שגיאה בתקשורת עם שרת הבינה המלאכותית.");
  }
};
