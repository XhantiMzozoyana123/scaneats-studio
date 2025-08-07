
/**
 * @fileoverview This file initializes and configures the Genkit AI instance.
 * It sets up the necessary plugins, such as Google AI, and exports a configured `ai` object.
 * This centralized setup ensures that Genkit is consistently configured throughout the application.
 *
 * It is important that this file is imported and used for all Genkit-related operations
 * to maintain a single, coherent AI configuration.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// This `ai` object will be used to define flows, prompts, and other Genkit features.
export const ai = genkit({
  plugins: [
    googleAI({
      // The API version can be specified here.
      // E.g., apiVersion: 'v1beta'
    }),
  ],
  // The log level can be set to 'debug' for more detailed output.
  // logLevel: 'debug',
  // This option prevents flow execution data from being stored, which is useful for privacy.
});
