
import { GoogleGenAI, Type } from "@google/genai";
import { TripPreferences, TripResponse, Site } from "../types";

const generateImageForSite = async (siteName: string, destination: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high-quality professional travel photograph of ${siteName} in ${destination}. Vibrant colors, realistic, cinematic lighting, wide angle view, no people, 16:9 aspect ratio.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error(`Failed to generate image for ${siteName}:`, error);
  }
  return undefined;
};

export const generateTripItinerary = async (prefs: TripPreferences): Promise<TripResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s for detailed text + images

  const prompt = `
    צור תכנית טיול מפורטת, עשירה ומרתקת ליעד: ${prefs.destination}.
    פרמטרים: ${prefs.duration} ימים, תקציב ${prefs.budgetPerNight}$, קצב ${prefs.pace}, סגנון ${prefs.style}.
    
    דרישות תוכן מחמירות לכל אתר (Site) במסלול:
    1. תיאור כללי (description): פסקה מעניינת על האתר.
    2. גאוגרפיה (geography): בדיוק 5 משפטים מפורטים על המבנה הגאוגרפי, המיקום והסביבה של האתר.
    3. היסטוריה (history): בדיוק 5 משפטים מפורטים על ההיסטוריה, הקמתו ואירועים משמעותיים.
    4. תרבות (culture): בדיוק 5 משפטים מפורטים על החשיבות התרבותית, מנהגים מקומיים או פולקלור הקשור לאתר.
    
    דרישות קולינריות:
    לכל יום, ספק המלצות קולינריות עם הסבר מפורט על המאכל, המקור שלו ומה הופך אותו למיוחד.
    
    דרישות מוזיקה ויוטיוב:
    אל תמציא קישורי וידאו ישירים (IDs). במקום זאת, צור קישור לחיפוש ביוטיוב בפורמט: https://www.youtube.com/results?search_query=[SEARCH+TERM]
    כאשר ה-SEARCH TERM הוא שם האמן והשיר או סגנון מוזיקלי מתאים ליעד.
    
    הנחיות כלליות:
    - השפה חייבת להיות עברית רהוטה ועשירה.
    - וודא שהמלונות רלוונטיים לתקציב וכוללים קישור תקין.
    - החזר JSON תקני בלבד.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
                      required: ["name", "description", "geography", "history", "culture"]
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

    if (!response || !response.text) {
      throw new Error("לא התקבלה תשובה מהשרת.");
    }

    const tripData = JSON.parse(response.text) as TripResponse;

    // Generate images for all sites in the itinerary in parallel
    const imagePromises: Promise<void>[] = [];
    
    tripData.itinerary.forEach(day => {
      day.sites.forEach(site => {
        const promise = generateImageForSite(site.name, prefs.destination).then(url => {
          if (url) site.imageUrl = url;
        });
        imagePromises.push(promise);
      });
    });

    await Promise.all(imagePromises);

    clearTimeout(timeoutId);
    return tripData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("החיבור התנתק עקב עומס או המתנה ארוכה מדי. אנא נסו שוב.");
    }
    console.error("Gemini API Error details:", error);
    throw new Error(error.message || "חלה שגיאה בתקשורת עם שרת הבינה המלאכותית.");
  }
};
