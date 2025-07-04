"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusIcon,
  Loader2Icon,
  Trash2Icon,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { galleryFormSchema, GalleryFormValues } from "./schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GalleryCreateSheetProps {
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onCreateSuccessAction: () => void;
}

export function GalleryCreateSheet({
  isOpen,
  onOpenChangeAction,
  onCreateSuccessAction,
}: GalleryCreateSheetProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      image: "", // This will be handled by the file input directly
      category: "",
      translations: [
        { locale: "en", title: "", description: "" },
        { locale: "ar", title: "", description: "" },
        { locale: "fa", title: "", description: "" },
      ],
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (values: GalleryFormValues) => {
    setIsSubmitting(true);
    toast({
      title: "Creating gallery item...",
      description: "Please wait while we add the new item.",
    });

    const formData = new FormData();

    // Append text fields
    formData.append("category", values.category);
    formData.append("translations", JSON.stringify(values.translations));

    // Append image file
    if (imageFile) {
      formData.append("image", imageFile);
    } else {
      // If no new image is selected and it's a create operation, ensure validation passes
      // The schema already enforces 'image' as URL, but for file upload, we handle it separately.
      // If it's a new item and no file is chosen, we should prevent submission.
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image is required to create a gallery item.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create gallery item.");
      }

      toast({
        title: "Success",
        description: "Gallery item created successfully!",
      });
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      onCreateSuccessAction();
      onOpenChangeAction(false);
    } catch (error) {
      console.error("Failed to create gallery item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while creating the gallery item.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    }
    onOpenChangeAction(open);
  };

  const addTranslation = () => {
    const currentTranslations = form.getValues("translations");
    form.setValue("translations", [
      ...currentTranslations,
      { locale: "", title: "", description: "" },
    ]);
  };

  const removeTranslation = (index: number) => {
    const currentTranslations = form.getValues("translations");
    const newTranslations = currentTranslations.filter((_, i) => i !== index);
    form.setValue("translations", newTranslations);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Gallery Item</SheetTitle>
          <SheetDescription>
            Add a new gallery item here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </FormControl>
              {imagePreview && (
                <div className="mt-2 relative w-full h-48 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Image Preview"
                    className="object-contain h-full w-full"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      const input = document.querySelector(
                        'input[type="file"]',
                      ) as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!imagePreview && (
                <div className="mt-2 w-full h-48 border rounded-md flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <FormMessage />
            </FormItem>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Quranic Calligraphy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-semibold mt-6">Translations</h3>
            {form.watch("translations").map((_, index) => (
              <div
                key={index}
                className="border p-4 rounded-md space-y-3 relative"
              >
                <FormField
                  control={form.control}
                  name={`translations.${index}.locale`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locale</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a locale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="fa">Farsi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description"
                          {...field}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("translations").length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeTranslation(index)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addTranslation}
              className="w-full"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add Another Translation
            </Button>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="mr-2 h-4 w-4" />
              )}
              Create Gallery Item
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
