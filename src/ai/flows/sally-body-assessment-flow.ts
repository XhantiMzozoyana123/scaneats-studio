
'use server';
/**
 * @fileOverview Provides AI-driven body assessment by Sally.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Profile } from '@/app/domain/profile';
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

// Define the input schema for the main flow
const BodyAssessmentInputSchema = z.object({
  clientDialogue: z.string().describe("The user's question or statement."),
  userProfile: ProfileSchema.describe("The user's profile data."),
});
export type BodyAssessmentInput = z.infer<typeof BodyAssessmentInputSchema>;

// Define the output schema for the main flow
const BodyAssessmentOutputSchema = z.object({
  agentDialogue: z.string().optional().describe("Sally's textual response to the user."),
  error: z.string().optional().describe("An error message if the process failed (e.g., 'subscription_required', 'insufficient_credits')."),
});
export type BodyAssessmentOutput = z.infer<typeof BodyAssessmentOutputSchema>;

const prompt = ai.definePrompt(
  {
    name: 'sallyBodyAssessmentPrompt',
    input: { schema: BodyAssessmentInputSchema },
    output: { schema: z.object({ agentDialogue: z.string() }) },
    tools: [verifyAccessTool, deductCreditTool],
    prompt: `You are Sally, a funny, witty, and helpful personal AI nutritionist and health assistant.
A user is asking a question about their health.

First, you MUST use the 'verifyUserAccess' tool to check if the user is allowed to make this request. Do not proceed if access is denied.

If access is granted, provide a conversational, funny, and helpful response to the user based on their question and profile data. Address them directly. Keep your response concise.

Finally, after generating your response, you MUST use the 'deductCredit' tool to deduct 1 credit for the successful interaction.

User's Profile Information:
{{{json userProfile}}}

User's Question:
"{{{clientDialogue}}}"`,
  }
);


export async function getBodyAssessment(input: BodyAssessmentInput): Promise<BodyAssessmentOutput> {
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    return { error: 'unauthorized' };
  }

  // Manually call the verification tool first, as the LLM might not always do it.
  const access = await verifyAccessTool({ authToken });

  if (!access.canAccess) {
    return { error: access.reason };
  }

  try {
    const { output } = await prompt(input, {
        tools: [
            // Provide the tools with the necessary auth token
            ai.tool(verifyAccessTool, async () => ({ authToken })),
            ai.tool(deductCreditTool, async () => ({ authToken, creditsToDeduct: 1 }))
        ]
    });

    if (!output?.agentDialogue) {
      // The model might have called the tools but not returned a final answer.
      // This can happen if the prompt isn't perfect. We'll treat it as an error.
      return { error: 'AI failed to generate a response after performing actions.' };
    }

    // Even though the prompt instructs the model to deduct, we'll ensure it happens.
    // Note: In a real-world scenario, you might want to check if the model *actually* called the tool.
    // For simplicity here, we deduct it manually after a successful response.
    const deduction = await deductCreditTool({ authToken, creditsToDeduct: 1 });
    if (!deduction.success) {
      console.warn("Failed to deduct credit after successful response:", deduction.message);
      // Decide if this should be a user-facing error. For now, we'll let the response go through.
    }
    
    return { agentDialogue: output.agentDialogue };

  } catch (e: any) {
    console.error("Error in getBodyAssessment flow:", e);
    return { error: e.message || "An unexpected error occurred." };
  }
}
