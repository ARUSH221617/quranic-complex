import { z } from "zod";

// Define the schema based on the Prisma model inferred from the API route
export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(), // Assuming phone can be optional
  subject: z.string(),
  message: z.string(),
  createdAt: z.coerce.date(), // Coerce string date from API to Date object
});

export type ContactData = z.infer<typeof contactSchema>;
