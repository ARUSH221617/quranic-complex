"use client";

import * as React from "react";
import { RefreshCwIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { z } from "zod";

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
import { RichTextEditor } from "@/components/rich-text-editor";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
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
import { Separator } from "@/components/ui/separator";
import { languages, LanguageId } from "@/lib/constants/languages";
import { programSchema } from "./schema";

// Schema for creating a new program
const createProgramSchema = z.object({
  locale: z.string(),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  schedule: z.string().min(1, "Schedule is required"),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

type CreateProgramFormData = z.infer<typeof createProgramSchema>;

interface ProgramCreateSheetProps {
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onCreateSuccessAction: () => void;
}

export function ProgramCreateSheet({
  isOpen,
  onOpenChangeAction,
  onCreateSuccessAction,
}: ProgramCreateSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedLocale, setSelectedLocale] = React.useState<LanguageId>("en");

  const form = useForm<CreateProgramFormData>({
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

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        locale: selectedLocale,
      });
      setImageFile(null);
      setImagePreview(null);

      const fileInput = document.getElementById("image") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
  }, [isOpen, form, selectedLocale]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (
        !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
          file.type,
        )
      ) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PNG, JPG, or WebP image.",
        });
        setImagePreview(null);
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
        setImagePreview(null);
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
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  async function onSubmit(data: CreateProgramFormData) {
    setIsSubmitting(true);
    const formData = new FormData();

    // Append all form data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append image if selected
    if (imageFile) {
      formData.append("image", imageFile);
    }

    toast({
      title: "Creating program...",
      description: "Please wait while we create the program.",
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/programs?locale=${data.locale}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        let errorData = { message: "Creation failed" };
        try {
          errorData = await response.json();
        } catch (e) {
          /* Ignore if response is not JSON */
        }
        throw new Error(
          errorData.message ||
            `Failed to create program. Status: ${response.status}`,
        );
      }

      const createdProgram = await response.json();

      toast({
        title: "Success",
        description: `Program created successfully in ${
          languages.find((l) => l.id === data.locale)?.name || data.locale
        }!`,
      });
      onCreateSuccessAction();
      onOpenChangeAction(false);
    } catch (error) {
      console.error("Creation failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Creation failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="gap-1 pr-6">
          <SheetTitle>Create New Program</SheetTitle>
          <SheetDescription>
            Create a new program. Fill in the details below.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <Form {...form}>
          <form
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
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Program Image
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="image" className="block text-sm font-medium">
                    Image
                  </Label>
                  {imagePreview ? (
                    <div className="relative mt-2 flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 overflow-hidden group transition duration-200 hover:shadow-lg">
                      <Image
                        src={imagePreview}
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
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
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
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              onChange={handleFileChange}
                            />
                          </Label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">
                          PNG, JPG, WebP up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {imagePreview
                      ? "Click to remove the current image."
                      : "Upload an image for the program."}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && (
                <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              )}
              Create Program
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
