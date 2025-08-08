
'use server';
/**
 * @fileOverview A Genkit tool for deducting a credit from a user's account.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { API_BASE_URL } from '@/app/shared/lib/api';

export const DeductCreditInputSchema = z.object({
  authToken: z.string().describe('The authorization token for the user.'),
  creditsToDeduct: z.number().describe('The number of credits to deduct.'),
});

export type DeductCreditInput = z.infer<typeof DeductCreditInputSchema>;

export const deductCreditTool = ai.defineTool(
  {
    name: 'deductCredit',
    description: 'Deducts a specified number of credits from the user\'s account after a successful AI interaction. This should only be called after verifying the user has access and after the AI has generated its main response.',
    inputSchema: DeductCreditInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/event/deduct-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.authToken}`,
        },
        body: JSON.stringify(input.creditsToDeduct),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Credit deducted successfully.',
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Failed to deduct credit.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while deducting credit.',
      };
    }
  }
);
