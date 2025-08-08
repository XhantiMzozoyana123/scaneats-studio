
'use server';
/**
 * @fileOverview Provides AI-driven meal plan insights by Sally.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { verifyAccessTool } from '@/ai/tools/verify-access-tool';
import { deductCreditTool } from '@/ai/tools/deduct-credit-tool';
import { MealPlannerInputSchema, MealPlannerOutputSchema, type MealPlannerInput, type MealPlannerOutput } from '../schemas';

const prompt = ai.definePrompt(
  {
    name: 'sallyMealPlannerPrompt',
    input: { schema: MealPlannerInputSchema },
    output: { schema: z.object({ agentDialogue: z.string() }) },
    tools: [verifyAccessTool, deductCreditTool],
    prompt: `You are Sally, a funny, witty, and helpful personal AI nutritionist.
A user is asking a question about a meal they just scanned.

First, you MUST use the 'verifyUserAccess' tool to check if the user is allowed to make this request. Do not proceed if access is denied.

If access is granted, provide a conversational, funny, and helpful response. Use their profile data and the details of the scanned food to give personalized advice. Address them directly. Keep your response concise.

Finally, after generating your response, you MUST use the 'deductCredit' tool to deduct 1 credit for the successful interaction.

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
        return { error: 'AI failed to generate a response after performing actions.' };
      }

      // Manually deduct credit after successful response for reliability
      const deduction = await deductCreditTool({ authToken: flowInput.authToken, creditsToDeduct: 1 });
      if (!deduction.success) {
        console.warn("Failed to deduct credit after successful response:", deduction.message);
      }
      
      return { agentDialogue: output.agentDialogue };

    } catch (e: any) {
      console.error("Error in getMealPlanInsight flow:", e);
      if (e.message && e.message.includes('subscription_required')) {
          return { error: 'subscription_required' };
      }
      if (e.message && e.message.includes('insufficient_credits')) {
          return { error: 'insufficient_credits' };
      }
      return { error: e.message || "An unexpected error occurred." };
    }
  });

  return await flow(input);
}
