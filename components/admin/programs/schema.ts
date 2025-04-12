import { z } from "zod";

// Define the schema based on the API response format
export const programSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  ageGroup: z.string(),
  schedule: z.string(),
  image: z.string().nullable(),
});

// Type for the program data based on the schema
export type ProgramData = z.infer<typeof programSchema>;