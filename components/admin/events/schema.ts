import { z } from "zod";

export const eventSchema = z.object({
  id: z.string(),
  image: z.string().url(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  name: z.string().min(1, { message: "Name is required." }),
  description: z.string().nullable(),
});

export type EventData = z.infer<typeof eventSchema>;

export const detailedEventSchema = z.object({
  id: z.string(),
  image: z.string().url().nullable(),
  date: z.date(),
  time: z.string(),
  location: z.string(),
  translations: z.array(
    z.object({
      locale: z.string().min(1, { message: "Locale is required." }),
      name: z.string().min(1, { message: "Name is required." }),
      description: z.string().nullable(),
    }),
  ),
});

export type DetailedEventData = z.infer<typeof detailedEventSchema>;

export const eventFormSchema = z.object({
  image: z.string().url({ message: "Invalid URL for image." }).nullable(),
  date: z.date(),
  time: z.string().min(1, { message: "Time is required." }),
  location: z.string().min(1, { message: "Location is required." }),
  translations: z.array(
    z.object({
      locale: z.string().min(1, { message: "Locale is required." }),
      name: z.string().min(1, { message: "Name is required." }),
      description: z.string().nullable(),
    }),
  ),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
