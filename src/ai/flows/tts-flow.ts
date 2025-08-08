
'use server';
/**
 * @fileOverview A flow for converting text to speech.
 *
 * - textToSpeech - A function that takes text and returns audio data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import wav from 'wav';

const TTSInputSchema = z.string();
const TTSOutputSchema = z.object({
  media: z.string().describe('The base64 encoded WAV audio data URI.'),
});

export async function textToSpeech(input: string): Promise<z.infer<typeof TTSOutputSchema>> {
  return ttsFlow(input);
}

// Helper function to convert raw PCM audio data to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
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
            prebuiltVoiceConfig: { voiceName: 'Kora' }, // Using Kora voice as requested
          },
        },
      },
      prompt: query,
    });

    if (!media || !media.url) {
      throw new Error('No media returned from TTS model.');
    }
    
    // The model returns a data URI with base64 encoded PCM data.
    // We must convert this raw PCM data into a proper WAV file for browser playback.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
