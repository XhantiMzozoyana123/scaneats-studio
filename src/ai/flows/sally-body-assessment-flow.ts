
'use server';
/**
 * @fileOverview Provides AI-driven body assessment by Sally.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { verifyAccessTool } from '@/ai/tools/verify-access-tool';
import { deductCreditTool } from '@/ai/tools/deduct-credit-tool';
import { BodyAssessmentInputSchema, BodyAssessmentOutputSchema, type BodyAssessmentInput, type BodyAssessmentOutput } from '../schemas';


const prompt = ai.definePrompt(
  {
    name: 'sallyBodyAssessmentPrompt',
    input: { schema: BodyAssessmentInputSchema },
    output: { schema: z.object({ agentDialogue: z.string() }) },
    prompt: `You are Sally, a funny, witty, and helpful personal AI nutritionist and health assistant.
A user is asking a question about their health.

Provide a conversational, funny, and helpful response to the user based on their question and profile data. Address them directly. Keep your response concise.

User's Profile Information:
{{{json userProfile}}}

User's Question:
"{{{clientDialogue}}}"`,
  }
);


export async function getBodyAssessment(input: BodyAssessmentInput): Promise<BodyAssessmentOutput> {
  const flow = ai.defineFlow(
    {
      name: 'bodyAssessmentFlow',
      inputSchema: BodyAssessmentInputSchema,
      outputSchema: BodyAssessmentOutputSchema,
    },
    async (flowInput) => {
      // Manually call the verification tool first for reliability.
      const access = await verifyAccessTool({ authToken: flowInput.authToken });

      if (!access.canAccess) {
        return { error: access.reason };
      }

      try {
        const { output } = await prompt(flowInput);

        if (!output?.agentDialogue) {
          return { error: 'AI failed to generate a response.' };
        }

        // Manually deduct credit after successful response for reliability
        const deduction = await deductCreditTool({ authToken: flowInput.authToken, creditsToDeduct: 1 });
        if (!deduction.success) {
          console.warn("Failed to deduct credit after successful response:", deduction.message);
        }
        
        return { agentDialogue: output.agentDialogue };

      } catch (e: any) {
        console.error("Error in getBodyAssessment flow:", e);
        return { error: e.message || "An unexpected error occurred." };
      }
    }
  );

  return await flow(input);
}
