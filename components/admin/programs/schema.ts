import { z } from "zod";

// Base schema for core program data
export const programSchema = z.object({
  id: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
});

// Schema for translatable program fields
export const programTranslationSchema = z.object({
  title: z.string(),
  description: z.string(),
  ageGroup: z.string(),
  schedule: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  keywords: z.string().nullable(),
});

// Combined schema for program with translations
export const programWithTranslationSchema = programSchema.extend({
  ...programTranslationSchema.shape,
});

// Infer TypeScript types from schemas
export type Program = z.infer<typeof programSchema>;
export type ProgramTranslation = z.infer<typeof programTranslationSchema>;
export type ProgramData = z.infer<typeof programWithTranslationSchema>;