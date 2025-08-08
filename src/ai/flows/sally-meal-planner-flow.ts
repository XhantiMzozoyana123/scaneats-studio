
'use server';
/**
 * @fileOverview Provides AI-driven meal plan insights by Sally.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Profile } from '@/app/domain/profile';
import type { ScannedFood } from '@/app/domain/scanned-food';
import { verifyAccessTool } from '@/ai/tools/verify-access-tool';
import { deductCreditTool } from '@/ai/tools/deduct-credit-tool';

// Define the schema for the user profile part of the input
const ProfileSchema = z.object({
  id: z.number().nullable(),
  name: z.string(),
  gender: z.string(),
  weight: z.union([z.number(), z.string()]),
  goals: z.string(),
  birthDate: z.date().nullable(),
  age: z.number().optional(),
  isSubscribed: z.boolean(),
  credits: z.number(),
});

// Define the schema for the scanned food
const ScannedFoodSchema = z.object({
  id: z.number(),
  name: z.string(),
  total: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

// Define the input schema for the main flow
const MealPlannerInputSchema = z.object({
  clientDialogue: z.string().describe("The user's question or statement about their meal."),
  userProfile: ProfileSchema.describe("The user's profile data."),
  lastScannedFood: ScannedFoodSchema.describe("The details of the last food item the user scanned."),
});
export type MealPlannerInput = z.infer<typeof MealPlannerInputSchema>;

// Define the output schema for the main flow
const MealPlannerOutputSchema = z.object({
  agentDialogue: z.string().optional().describe("Sally's textual response to the user."),
  error: z.string().optional().describe("An error message if the process failed (e.g., 'subscription_required', 'insufficient_credits')."),
});
export type MealPlannerOutput = z.infer<typeof MealPlannerOutputSchema>;

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
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    return { error: 'unauthorized' };
  }

  // Manually call the verification tool first for reliability
  const access = await verifyAccessTool({ authToken });

  if (!access.canAccess) {
    return { error: access.reason };
  }
  
  try {
    const { output } = await prompt(input, {
        tools: [
            ai.tool(verifyAccessTool, async () => ({ authToken })),
            ai.tool(deductCreditTool, async () => ({ authToken, creditsToDeduct: 1 }))
        ]
    });

    if (!output?.agentDialogue) {
      return { error: 'AI failed to generate a response after performing actions.' };
    }

    // Manually deduct credit after successful response for reliability
    const deduction = await deductCreditTool({ authToken, creditsToDeduct: 1 });
    if (!deduction.success) {
      console.warn("Failed to deduct credit after successful response:", deduction.message);
    }
    
    return { agentDialogue: output.agentDialogue };

  } catch (e: any) {
    console.error("Error in getMealPlanInsight flow:", e);
    return { error: e.message || "An unexpected error occurred." };
  }
}
