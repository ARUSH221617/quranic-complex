import { z } from "zod";

export const gallerySchema = z.object({
  id: z.string(),
  image: z.string().url(),
  category: z.string().min(1, { message: "Category is required." }),
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().nullable(),
});

export type GalleryData = z.infer<typeof gallerySchema>;

export const detailedGallerySchema = z.object({
  id: z.string(),
  image: z.string().url().nullable(), // Image can be null for existing items
  category: z.string().min(1, { message: "Category is required." }),
  translations: z.array(
    z.object({
      locale: z.string().min(1, { message: "Locale is required." }),
      title: z.string().min(1, { message: "Title is required." }),
      description: z.string().nullable(),
    }),
  ),
});

export type DetailedGalleryData = z.infer<typeof detailedGallerySchema>;

export const galleryFormSchema = z.object({
  image: z.string().url({ message: "Invalid URL for image." }).nullable(), // Make image nullable for form, as it can be cleared
  category: z.string().min(1, { message: "Category is required." }),
  translations: z.array(
    z.object({
      locale: z.string().min(1, { message: "Locale is required." }),
      title: z.string().min(1, { message: "Title is required." }),
      description: z.string().nullable(),
    }),
  ),
});

export type GalleryFormValues = z.infer<typeof galleryFormSchema>;
