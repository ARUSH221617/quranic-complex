"use client";

import * as React from "react";
import { RefreshCwIcon, Trash, Edit, AlertCircle } from "lucide-react"; // Added AlertCircle
import { useForm } from "react-hook-form";
import Image from "next/image";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query"; // Import useQuery

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { NewsData } from "./schema";
import { Separator } from "@/components/ui/separator";
import { languages, LanguageId } from "@/lib/constants/languages";

// Define the schema for the edit form with translations
const editNewsFormSchema = z.object({
  locale: z.string(),
  slug: z.string().optional(),
  date: z.string(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

type EditNewsFormData = z.infer<typeof editNewsFormSchema>;

interface NewsEditSheetProps {
  news: NewsData | null;
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onUpdateSuccessAction: () => void;
}

export function NewsEditSheet({
  news,
  isOpen,
  onOpenChangeAction,
  onUpdateSuccessAction,
}: NewsEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = React.useState<LanguageId>("en");

  const form = useForm<EditNewsFormData>({
    mode: "onSubmit",
    defaultValues: {
      locale: "en",
      title: "",
      slug: "",
      date: new Date().toISOString().split('T')[0],
      excerpt: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      keywords: "",
    },
  });

  // Fetch news translation using React Query
  const {
    data: translatedNews,
    isLoading: isLoadingTranslation,
    isError: isTranslationError,
    error: translationError,
  } = useQuery<NewsData>({
    queryKey: ["news", news?.id, selectedLocale],
    queryFn: async () => {
      if (!news?.id) {
        throw new Error("News ID is missing");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/news/${news.id}?locale=${selectedLocale}`,
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Failed to fetch news translation",
        );
      }
      return response.json();
    },
    enabled: isOpen && !!news?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Effect to reset form when translation data loads or news/locale changes
  React.useEffect(() => {
    if (isOpen && news) {
      if (translatedNews) {
        form.reset({
          locale: selectedLocale,
          title: translatedNews.title ?? "",
          slug: translatedNews.slug ?? news.slug ?? "", // Fallback to original slug
          date: new Date(translatedNews.date || news.date) // Use translated or original date
            .toISOString()
            .split("T")[0],
          excerpt: translatedNews.excerpt ?? "",
          content: translatedNews.content ?? "",
          metaTitle: translatedNews.metaTitle ?? null,
          metaDescription: translatedNews.metaDescription ?? null,
          keywords: translatedNews.keywords ?? null,
        });
      } else if (!isLoadingTranslation && !isTranslationError) {
        // Reset with base news data or defaults for the selected locale
        form.reset({
          locale: selectedLocale,
          title: "", // Clear translated fields
          slug: news.slug ?? "", // Keep shared fields
          date: new Date(news.date).toISOString().split("T")[0],
          excerpt: "",
          content: "",
          metaTitle: null,
          metaDescription: null,
          keywords: null,
        });
      }
      setImagePreview(news.image || null);
    } else if (!isOpen) {
      form.reset({ locale: "en", date: new Date().toISOString().split("T")[0] });
      setImageFile(null);
      setImagePreview(null);
    }

    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, [
    news,
    translatedNews,
    selectedLocale,
    isOpen,
    form,
    isLoadingTranslation,
    isTranslationError,
  ]);

  // Effect to show toast on error
  React.useEffect(() => {
    if (isTranslationError && translationError) {
      toast({
        variant: "destructive",
        title: "Error Fetching Translation",
        description:
          translationError instanceof Error
            ? translationError.message
            : "Could not load data for the selected language.",
      });
    }
  }, [isTranslationError, translationError, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PNG or JPG image.",
        });
        setImagePreview(news?.image || null); // Revert to original if invalid
        setImageFile(null);
        event.target.value = "";
        return;
      }
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be less than 5MB.",
        });
        setImagePreview(news?.image || null); // Revert to original if too large
        setImageFile(null);
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected, revert to the original news image preview
      setImagePreview(news?.image || null);
      setImageFile(null);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null); // Clear the preview entirely
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Reset file input
    }
  };

  async function onSubmit(data: EditNewsFormData) {
    if (!news) return;

    setIsSubmitting(true);
    const formData = new FormData();

    // Always append locale
    formData.append("locale", data.locale);

    // Append text data - send all values for the current locale
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "locale" && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append image file if it has been newly selected
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imagePreview === null && news.image !== null) {
      // If preview is null AND there was an original image, signal removal
      formData.append("remove_image", "true");
    }

    toast({
      title: "Updating news item...",
      description: `Saving changes for ${news.title || news.id}`,
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/news/${news.id}?locale=${data.locale}`,
        {
          method: "PATCH",
          body: formData,
        },
      );

      if (!response.ok) {
        let errorData = { message: "Update failed" };
        try {
          errorData = await response.json();
        } catch (e) {
          /* Ignore if response is not JSON */
        }
        throw new Error(
          errorData.message ||
            `Failed to update news item. Status: ${response.status}`,
        );
      }

      const updatedNews = await response.json();

      toast({
        title: "Success",
        description: `News item updated successfully in ${languages.find((l) => l.id === data.locale)?.name || data.locale}!`,
      });
      onUpdateSuccessAction();
      onOpenChangeAction(false);
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Update failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentImageSrc = imagePreview || news?.image;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="gap-1 pr-6">
          {/* Use news?.title or news?.id safely */}
          <SheetTitle>
            Edit News: {news?.title || news?.id || "Loading..."}
          </SheetTitle>
          <SheetDescription>
            Modify news details. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        {/* Add key to Form to force re-render on news change */}
        <Form {...form}>
          <form
            key={news?.id || "new"} // Force re-render when news changes
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col space-y-6 overflow-y-auto px-1 py-2"
          >
            {/* News Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  News Details
                </h3>
                <FormField
                  control={form.control}
                  name="locale"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedLocale(value as LanguageId);
                        }}
                      >
                        <SelectTrigger className="w-[140px] ml-auto">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.id} value={lang.id}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Shared Fields Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Shared Properties
                </h4>
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="news-slug"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Translated Fields Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Translated Content -{" "}
                  {languages.find((l) => l.id === selectedLocale)?.name}
                </h4>
                {/* Loading Skeleton */}
                {isLoadingTranslation && (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" /> {/* Title */}
                    <Skeleton className="h-20 w-full" /> {/* Excerpt */}
                    <Skeleton className="h-40 w-full" /> {/* Content */}
                    <div className="space-y-4 rounded-lg border p-4">
                      <Skeleton className="h-4 w-1/4" /> {/* SEO Title Label */}
                      <Skeleton className="h-10 w-full" /> {/* SEO Title Input */}
                      <Skeleton className="h-4 w-1/4" /> {/* SEO Desc Label */}
                      <Skeleton className="h-16 w-full" /> {/* SEO Desc Textarea */}
                      <Skeleton className="h-4 w-1/4" /> {/* Keywords Label */}
                      <Skeleton className="h-10 w-full" /> {/* Keywords Input */}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {isTranslationError && !isLoadingTranslation && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {translationError instanceof Error
                        ? translationError.message
                        : "Could not load translation data."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form Fields */}
                {!isLoadingTranslation && (
                  <>
                    <FormField
                      control={form.control}
                      name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="News Title"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief excerpt of the news item..."
                          {...field}
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <TipTapEditor
                          value={field.value || ""}
                          onChangeAction={field.onChange}
                          dir={
                            selectedLocale === "ar" || selectedLocale === "fa"
                              ? "rtl"
                              : "ltr"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SEO Fields */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h5 className="text-sm font-medium text-muted-foreground">
                    SEO Details
                  </h5>
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SEO Meta Title"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="SEO Meta Description"
                            {...field}
                            value={field.value || ""}
                            rows={2}
                          />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="comma-separated keywords"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                News Image
              </h3>
              <div className="space-y-2 rounded-md border border-dashed p-4">
                <Label htmlFor="image" className="block text-sm font-medium">
                  Image
                </Label>
                {/* Preview and Actions Container */}
                {currentImageSrc ? (
                  <div className="relative mt-2 flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 overflow-hidden group transition duration-200 hover:shadow-lg">
                    <Image
                      // Use a key to force re-render if src changes between preview and news.image
                      key={currentImageSrc}
                      src={currentImageSrc}
                      alt="News Image Preview"
                      layout="fill"
                      objectFit="contain"
                      className="transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-50 flex items-center justify-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleImageRemove}
                          className="h-8 w-8 p-1 rounded-full"
                          aria-label="Remove image"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            document.getElementById("image")?.click()
                          }
                          className="h-8 w-8 p-1 rounded-full"
                          aria-label="Change image"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Hidden input stays here */}
                    <Input
                      id="image"
                      type="file"
                      className="sr-only"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                    <div className="text-center">
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <Label
                          htmlFor="image"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/90"
                        >
                          <span>Upload a file</span>
                          <Input
                            id="image"
                            type="file"
                            className="sr-only"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFileChange}
                          />
                        </Label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {currentImageSrc
                    ? "Click edit to change or trash to remove."
                    : "Upload an image for the news item."}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (!form.formState.isDirty &&
                  !imageFile &&
                  imagePreview === news?.image)
              }
              className="w-full"
            >
              {isSubmitting && (
                <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
        <SheetFooter className="mt-auto pt-6">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
