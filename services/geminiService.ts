
import { GoogleGenAI, Type } from "@google/genai";
import { Pedal, Amplifier } from "../types";

export const getToneAdjustment = async (songTitle: string, currentPedals: Pedal[], currentAmp: Amplifier) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const pedalContext = currentPedals.map(p => `${p.name} (${p.type})`).join(', ');
  const ampContext = currentAmp.name;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `I have a guitar rig with an amplifier: "${ampContext}" and these pedals: [${pedalContext}].
    1. Determine the ideal settings for this gear to match the song: "${songTitle}".
    2. For EACH pedal currently on the board, decide if it should be ENABLED (isActive: true) or BYPASSED (isActive: false) to achieve the tone. If a pedal is not needed, set isActive to false.
    3. Provide values from 0 to 10 for each knob. Only include knobs that exist on the gear.
    4. Provide the lyrics and chords for this song in a professional songbook format: 
       - Chords on their own line, placed EXACTLY above the lyric word where the change occurs.
       - Lyrics on the next line.
       - Use double spaces between verse/chorus blocks.
       - Format as Markdown.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          songInfo: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              lyricsWithChords: { type: Type.STRING, description: "Lyrics and chords in professional songbook format" }
            },
            required: ["title", "lyricsWithChords"]
          },
          pedals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                isActive: { type: Type.BOOLEAN, description: "Whether the pedal should be engaged for this tone" },
                settings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      knob: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    },
                    required: ["knob", "value"]
                  }
                }
              },
              required: ["name", "settings", "isActive"]
            }
          },
          amplifier: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              settings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    knob: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  },
                  required: ["knob", "value"]
                }
              }
            },
            required: ["name", "settings"]
          }
        },
        required: ["pedals", "amplifier", "songInfo"]
      }
    }
  });

  return JSON.parse(response.text);
};
