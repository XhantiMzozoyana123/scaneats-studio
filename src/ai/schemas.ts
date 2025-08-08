
/**
 * @fileOverview This file defines the shared Zod schemas and TypeScript types for AI flows.
 * By centralizing schemas here, we avoid "'use server' file can only export functions" errors,
 * as this file does not contain the 'use server' directive and can be safely imported by
 * both server-side flows and client-side components if needed.
 */

import { z } from 'zod';
import type { Profile } from '@/app/domain/profile';
import type { ScannedFood } from '@/app/domain/scanned-food';

// Schema for the user profile part of the input
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

// Schemas and types for Body Assessment Flow
export const BodyAssessmentInputSchema = z.object({
  clientDialogue: z.string().describe("The user's question or statement."),
  userProfile: ProfileSchema.describe("The user's profile data."),
  authToken: z.string().describe('The authorization token for the user.'),
});
export type BodyAssessmentInput = z.infer<typeof BodyAssessmentInputSchema>;

export const BodyAssessmentOutputSchema = z.object({
  agentDialogue: z.string().optional().describe("Sally's textual response to the user."),
  error: z.string().optional().describe("An error message if the process failed (e.g., 'subscription_required', 'insufficient_credits')."),
});
export type BodyAssessmentOutput = z.infer<typeof BodyAssessmentOutputSchema>;


// Schema for the scanned food
const ScannedFoodSchema = z.object({
  id: z.number(),
  name: z.string(),
  total: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

// Schemas and types for Meal Planner Flow
export const MealPlannerInputSchema = z.object({
  clientDialogue: z.string().describe("The user's question or statement about their meal."),
  userProfile: ProfileSchema.describe("The user's profile data."),
  lastScannedFood: ScannedFoodSchema.describe("The details of the last food item the user scanned."),
  authToken: z.string().describe('The authorization token for the user.'),
});
export type MealPlannerInput = z.infer<typeof MealPlannerInputSchema>;

export const MealPlannerOutputSchema = z.object({
  agentDialogue: z.string().optional().describe("Sally's textual response to the user."),
  error: z.string().optional().describe("An error message if the process failed (e.g., 'subscription_required', 'insufficient_credits')."),
});
export type MealPlannerOutput = z.infer<typeof MealPlannerOutputSchema>;
