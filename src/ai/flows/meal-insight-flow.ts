
'use server';
/**
 * @fileOverview Provides AI-driven insights into a given meal.
 *
 * - getMealInsight - A function that analyzes a meal and provides nutritional feedback.
 * - MealInsightInput - The input type for the getMealInsight function.
 * - MealInsightOutput - The return type for the getMealInsight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MealInsightInputSchema = z.object({
  mealName: z.string().describe('The name of the food item or meal.'),
  calories: z.number().describe('The total calories of the meal.'),
  protein: z.number().describe('The protein content in grams.'),
  fat: z.number().describe('The fat content in grams.'),
  carbs: z.number().describe('The carbohydrate content in grams.'),
  userGoals: z.string().describe("The user's dietary goals (e.g., 'lose weight', 'build muscle')."),
});
export type MealInsightInput = z.infer<typeof MealInsightInputSchema>;

const MealInsightOutputSchema = z.object({
  feedback: z.string().describe("A short, encouraging, and insightful analysis of the meal in relation to the user's goals."),
  suggestion: z.string().describe('A simple, actionable suggestion for the next meal or for the rest of the day.'),
});
export type MealInsightOutput = z.infer<typeof MealInsightOutputSchema>;


export async function getMealInsight(input: MealInsightInput): Promise<MealInsightOutput> {
  return mealInsightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mealInsightPrompt',
  input: { schema: MealInsightInputSchema },
  output: { schema: MealInsightOutputSchema },
  prompt: `You are Sally, a friendly and knowledgeable AI nutritionist.
  A user has just scanned a meal and wants your feedback.
  Analyze the following meal in the context of the user's goals.
  Keep your feedback concise, positive, and easy to understand.

  Meal Details:
  - Name: {{{mealName}}}
  - Calories: {{{calories}}}
  - Protein: {{{protein}}}g
  - Fat: {{{fat}}}g
  - Carbs: {{{carbs}}}g

  User's Goal: {{{userGoals}}}

  Based on this, provide a short 'feedback' on how this meal fits into their goals and a simple, actionable 'suggestion'.
  For example, if the meal is high in carbs and the goal is weight loss, you might suggest a lighter dinner.
  If the meal is well-balanced, praise them and suggest a healthy snack for later.
  Address the user in a friendly, second-person tone (e.g., "This looks like a great choice...").`,
});


const mealInsightFlow = ai.defineFlow(
  {
    name: 'mealInsightFlow',
    inputSchema: MealInsightInputSchema,
    outputSchema: MealInsightOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
