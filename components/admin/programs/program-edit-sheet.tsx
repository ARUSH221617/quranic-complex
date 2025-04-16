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
import { ProgramData } from "./schema";
import { Separator } from "@/components/ui/separator";
import { languages, LanguageId } from "@/lib/constants/languages";

// Define the schema for the edit form with translations
const editProgramFormSchema = z.object({
  locale: z.string(),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  schedule: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

type EditProgramFormData = z.infer<typeof editProgramFormSchema>;

interface ProgramEditSheetProps {
  program: ProgramData | null;
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onUpdateSuccessAction: () => void;
}

export function ProgramEditSheet({
  program,
  isOpen,
  onOpenChangeAction,
  onUpdateSuccessAction,
}: ProgramEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = React.useState<LanguageId>("en");

  const form = useForm<EditProgramFormData>({
    mode: "onSubmit",
    defaultValues: {
      locale: "en",
      title: "",
      slug: "",
      description: "",
      ageGroup: "",
      schedule: "",
      metaTitle: "",
      metaDescription: "",
      keywords: "",
    },
  });

  // Fetch program translation using React Query
  const {
    data: translatedProgram,
    isLoading: isLoadingTranslation,
    isError: isTranslationError,
    error: translationError,
  } = useQuery<ProgramData>({
    queryKey: ["program", program?.id, selectedLocale],
    queryFn: async () => {
      if (!program?.id) {
        // This should ideally not happen if the sheet is opened with a program
        throw new Error("Program ID is missing");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/programs/${program.id}?locale=${selectedLocale}`,
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error JSON
        throw new Error(
          errorData?.message || "Failed to fetch program translation",
        );
      }
      return response.json();
    },
    // Only fetch when the sheet is open and a program is selected
    enabled: isOpen && !!program?.id,
    // Optional: Cache data for 5 minutes, refetch on window focus disabled
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Effect to reset form when translation data loads or program/locale changes
  React.useEffect(() => {
    if (isOpen && program) {
      if (translatedProgram) {
        // Reset form with fetched data
        form.reset({
          locale: selectedLocale,
          title: translatedProgram.title ?? "",
          slug: translatedProgram.slug ?? program.slug ?? "", // Fallback to original slug if translation missing
          description: translatedProgram.description ?? "",
          ageGroup: translatedProgram.ageGroup ?? "",
          schedule: translatedProgram.schedule ?? "",
          metaTitle: translatedProgram.metaTitle ?? null,
          metaDescription: translatedProgram.metaDescription ?? null,
          keywords: translatedProgram.keywords ?? null,
        });
      } else if (!isLoadingTranslation && !isTranslationError) {
        // If not loading and no error, but no data (e.g., first load for a locale)
        // Reset with base program data or defaults for the selected locale
        form.reset({
          locale: selectedLocale,
          title: "", // Clear translated fields
          slug: program.slug ?? "", // Keep shared fields like slug
          description: "",
          ageGroup: "",
          schedule: "",
          metaTitle: null,
          metaDescription: null,
          keywords: null,
        });
      }
      // Always set image preview based on the base program prop
      setImagePreview(program.image || null);
    } else if (!isOpen) {
      // Reset form and image state when sheet closes
      form.reset({ locale: "en" }); // Reset to default locale or keep selectedLocale?
      setImageFile(null);
      setImagePreview(null);
    }

    // Reset file input visually when sheet opens/closes or program changes
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    // We don't reset the form if !program, assuming sheet closes in that case
  }, [
    program,
    translatedProgram,
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
        setImagePreview(program?.image || null); // Revert to original if invalid
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
        setImagePreview(program?.image || null); // Revert to original if too large
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
      // If no file is selected, revert to the original program image preview
      setImagePreview(program?.image || null);
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

  async function onSubmit(data: EditProgramFormData) {
    if (!program) return;

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
    } else if (imagePreview === null && program.image !== null) {
      // If preview is null AND there was an original image, signal removal
      formData.append("remove_image", "true");
    }

    toast({
      title: "Updating program...",
      description: `Saving changes for ${program.title || program.id}`,
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/programs/${program.id}?locale=${data.locale}`,
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
            `Failed to update program. Status: ${response.status}`,
        );
      }

      const updatedProgram = await response.json();

      toast({
        title: "Success",
        description: `Program updated successfully in ${languages.find((l) => l.id === data.locale)?.name || data.locale}!`,
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

  const currentImageSrc = imagePreview || program?.image;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="gap-1 pr-6">
          {/* Use program?.title or program?.id safely */}
          <SheetTitle>
            Edit Program: {program?.title || program?.id || "Loading..."}
          </SheetTitle>
          <SheetDescription>
            Modify program details. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        {/* Add key to Form to force re-render on program change */}
        <Form {...form}>
          <form
            key={program?.id || "new"} // Force re-render when program changes
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col space-y-6 overflow-y-auto px-1 py-2"
          >
            {/* Program Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Program Details
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
                          placeholder="program-slug"
                          {...field}
                          value={field.value || ""}
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
                    <Skeleton className="h-24 w-full" /> {/* Description */}
                    <Skeleton className="h-10 w-full" /> {/* Age Group */}
                    <Skeleton className="h-10 w-full" /> {/* Schedule */}
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

                {/* Form Fields (Render only when not loading and no error, or if data exists despite error) */}
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
                          placeholder="Program Title"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <TipTapEditor
                          placeholder="Program Description"
                          {...field}
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
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Adults, Kids 5-7"
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
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mon & Wed 6-8 PM"
                          {...field}
                          value={field.value || ""}
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
                Program Image
              </h3>
              <div className="space-y-2 rounded-md border border-dashed p-4">
                <Label htmlFor="image" className="block text-sm font-medium">
                  Image
                </Label>
                {/* Preview and Actions Container */}
                {currentImageSrc ? (
                  <div className="relative mt-2 flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 overflow-hidden group transition duration-200 hover:shadow-lg">
                    <Image
                      // Use a key to force re-render if src changes between preview and program.image
                      key={currentImageSrc}
                      src={currentImageSrc}
                      alt="Program Image Preview"
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
                    : "Upload an image for the program."}
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
                  imagePreview === program?.image)
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
