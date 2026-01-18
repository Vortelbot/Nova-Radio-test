
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./audioUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateDJIntro(songTitle: string, artist: string, audioContext: AudioContext): Promise<AudioBuffer | null> {
  try {
    const prompt = `Act as a high-energy, smooth-talking radio DJ named 'Nova'. 
    Give a short, 5-second energetic introduction for the next song: "${songTitle}" by ${artist}. 
    Keep it cool, modern, and exciting. Only the voice.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck sounds energetic for radio
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const decodedBytes = decodeBase64(base64Audio);
      return await decodeAudioData(decodedBytes, audioContext, 24000, 1);
    }
  } catch (error) {
    console.error("Error generating DJ intro:", error);
  }
  return null;
}
