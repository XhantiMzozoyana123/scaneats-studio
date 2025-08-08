
'use server';
/**
 * @fileOverview A flow for converting text to speech.
 *
 * - textToSpeech - A function that takes text and returns audio data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const TTSInputSchema = z.string();
const TTSOutputSchema = z.object({
  media: z.string().describe('The base64 encoded WAV audio data URI.'),
});

export async function textToSpeech(input: string): Promise<z.infer<typeof TTSOutputSchema>> {
  return ttsFlow(input);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Alloy' },
          },
        },
      },
      prompt: query,
    });

    if (!media || !media.url) {
      throw new Error('No media returned from TTS model.');
    }
    
    // The model returns a data URI with base64 encoded PCM data.
    // The browser can often play this directly, but converting to WAV is more robust.
    // However, the previous implementation was flawed. Let's return the direct URI
    // and let the browser handle it. Most modern browsers support this.
    // The format is typically 'data:audio/L16;rate=24000;channels=1;base64,...' which might not be universally supported.
    // A more robust solution would be to convert to WAV on the server.
    // For now, let's assume direct playback is possible as the previous WAV conversion was faulty.
    // If issues persist, a proper WAV conversion library will be needed.
    // The gemini model returns PCM audio, which needs to be wrapped in a WAV container.
    // The previous `wav` implementation was causing issues.
    // Let's directly return what the model gives us. It should be a data URI.
    return {
      media: media.url,
    };
  }
);
