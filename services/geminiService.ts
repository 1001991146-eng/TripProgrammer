
import { GoogleGenAI, Type } from "@google/genai";
import { TripPreferences, TripResponse, Site } from "../types";

const generateImageForSite = async (siteName: string, destination: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional travel photograph of ${siteName} in ${destination}. High resolution, realistic, cinematic lighting, vibrant colors, 16:9 aspect ratio.` }],
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
  // Returning to Flash model for speed and to prevent "stuck" behavior
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

  const prompt = `
    צור תכנית טיול מפורטת עבור היעד: ${prefs.destination}.
    פרמטרים: בדיוק ${prefs.duration} ימים, תקציב ${prefs.budgetPerNight}$, קצב ${prefs.pace}, סגנון ${prefs.style}.
    
    הנחיות קריטיות:
    - חובה לייצר אובייקט עבור כל יום בנפרד, מיום 1 ועד יום ${prefs.duration} ברצף מלא. 
    - אל תדלג על אף יום! (למשל, אל תקפוץ מיום 1 ליום 10).
    - היה תמציתי אך איכותי בכל תיאור כדי למנוע חריגה מגבולות הטקסט.
    
    דרישות לכל אתר (Site):
    1. תיאור (description): פסקה מעניינת וקצרה.
    2. גאוגרפיה (geography): 3-5 משפטים על האזור.
    3. היסטוריה (history): 3-5 משפטים על העבר.
    4. תרבות (culture): 3-5 משפטים על האווירה והתרבות.
    
    דרישות קולינריות:
    המלצה אחת מפורטת ליום על מאכל מקומי וההקשר התרבותי שלו.
    
    דרישות מוזיקה:
    קישור חיפוש יוטיוב בפורמט: https://www.youtube.com/results?search_query=[Artist+Song]
    
    החזר JSON תקני בלבד בעברית.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Reverted to Flash for better performance/reliability
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
    
    // Client-side sort to guarantee order even if AI fluctuates
    tripData.itinerary.sort((a, b) => a.dayNumber - b.dayNumber);

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
      throw new Error("זמן ההמתנה הסתיים. נסו שוב או קצרו מעט את משך הטיול.");
    }
    throw new Error(error.message || "חלה שגיאה בתקשורת עם שרת הבינה המלאכותית.");
  }
};
