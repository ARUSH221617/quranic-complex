import { z } from "zod";

export const newsSchema = z.object({
  id: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
  date: z.date(),
});

export const newsTranslationSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  keywords: z.string().nullable(),
});

export const newsWithTranslationSchema = newsSchema.extend({
  ...newsTranslationSchema.shape,
});

export type News = z.infer<typeof newsSchema>;
export type NewsTranslation = z.infer<typeof newsTranslationSchema>;
export type NewsData = z.infer<typeof newsWithTranslationSchema>;
