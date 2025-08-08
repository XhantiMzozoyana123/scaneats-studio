
'use server';
/**
 * @fileOverview A Genkit tool to verify user access based on subscription and credit status.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { API_BASE_URL } from '@/app/shared/lib/api';

export const VerifyAccessInputSchema = z.object({
  authToken: z.string().describe('The authorization token for the user.'),
});

export type VerifyAccessInput = z.infer<typeof VerifyAccessInputSchema>;

export const verifyAccessTool = ai.defineTool(
  {
    name: 'verifyUserAccess',
    description: 'Checks if the user has permission to use a feature by verifying their subscription status and credit balance. This MUST be called before generating a response.',
    inputSchema: VerifyAccessInputSchema,
    outputSchema: z.object({
      canAccess: z.boolean(),
      reason: z.string().describe('Reason for denial (e.g., "subscription_required", "insufficient_credits") or "access_granted".'),
    }),
  },
  async (input) => {
    try {
      // Fetch subscription status and credit balance in parallel
      const [subRes, credRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/event/subscription/status`, {
          headers: { Authorization: `Bearer ${input.authToken}` },
        }),
        fetch(`${API_BASE_URL}/api/event/credits/remaining`, {
          headers: { Authorization: `Bearer ${input.authToken}` },
        }),
      ]);

      if (!subRes.ok || !credRes.ok) {
        if (subRes.status === 401 || credRes.status === 401) {
            return { canAccess: false, reason: 'unauthorized' };
        }
        throw new Error('Failed to verify user access status.');
      }

      const subData = await subRes.json();
      const credData = await credRes.json();

      if (!subData.isSubscribed) {
        return { canAccess: false, reason: 'subscription_required' };
      }

      if (credData.remainingCredits <= 0) {
        return { canAccess: false, reason: 'insufficient_credits' };
      }

      return { canAccess: true, reason: 'access_granted' };
    } catch (error: any) {
      return { canAccess: false, reason: error.message || 'verification_failed' };
    }
  }
);
