
'use server';
/**
 * @fileOverview Provides AI-driven meal plan insights by Sally.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { verifyAccessTool } from '@/ai/tools/verify-access-tool';
import { deductCreditTool } from '@/ai/tools/deduct-credit-tool';
import { MealPlannerInputSchema, MealPlannerOutputSchema, type MealPlannerInput, type MealPlannerOutput } from '../schemas';
import { googleAI } from '@genkit-ai/googleai';

const prompt = ai.definePrompt(
  {
    name: 'sallyMealPlannerPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: MealPlannerInputSchema },
    output: { schema: z.object({ agentDialogue: z.string() }) },
    prompt: `You are Sally, a funny, witty, and helpful personal AI nutritionist.
A user is asking a question about a meal they just scanned.

Provide a conversational, funny, and helpful response. Use their profile data and the details of the scanned food to give personalized advice. Address them directly. Keep your response concise.

User's Profile:
{{{json userProfile}}}

Last Scanned Food:
{{{json lastScannedFood}}}

User's Question:
"{{{clientDialogue}}}"`,
  }
);

export async function getMealPlanInsight(input: MealPlannerInput): Promise<MealPlannerOutput> {
  const flow = ai.defineFlow({
      name: 'mealPlanInsightFlow',
      inputSchema: MealPlannerInputSchema,
      outputSchema: MealPlannerOutputSchema,
  }, async (flowInput) => {
    // Manually call the verification tool first for reliability
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
      console.error("Error in getMealPlanInsight flow:", e);
      return { error: e.message || "An unexpected error occurred." };
    }
  });

  return await flow(input);
}
