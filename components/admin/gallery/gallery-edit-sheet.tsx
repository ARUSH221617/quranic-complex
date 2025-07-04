"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2Icon,
  Trash2Icon,
  Image as ImageIcon,
  AlertCircle,
  PlusIcon,
  Trash2Icon as DeleteIcon,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  galleryFormSchema,
  GalleryFormValues,
  DetailedGalleryData,
} from "./schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GalleryEditSheetProps {
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onUpdateSuccessAction: () => void;
  galleryId: string | null;
}

export function GalleryEditSheet({
  isOpen,
  onOpenChangeAction,
  onUpdateSuccessAction,
  galleryId,
}: GalleryEditSheetProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState("");
  const [replacementCategory, setReplacementCategory] = React.useState("");

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      image: "",
      category: "",
      translations: [
        { locale: "en", title: "", description: "" },
        { locale: "ar", title: "", description: "" },
        { locale: "fa", title: "", description: "" },
      ],
    },
  });

  const {
    data: categories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery<string[]>({
    queryKey: ["galleryCategories"],
    queryFn: async () => {
      const response = await fetch(`/api/gallery/categories`);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
    enabled: isOpen, // Only fetch when the sheet is open
  });

  const {
    data: galleryItem,
    isLoading,
    isError,
    error,
  } = useQuery<DetailedGalleryData>({
    queryKey: ["gallery", galleryId],
    queryFn: async () => {
      if (!galleryId) {
        throw new Error("Gallery ID is missing");
      }
      const response = await fetch(`/api/gallery/${galleryId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.message || "Failed to fetch gallery details",
        );
      }
      return response.json();
    },
    enabled: isOpen && !!galleryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (galleryItem) {
      // Set initial image preview from existing gallery item
      setImagePreview(galleryItem.image);
      setImageFile(null); // Clear any previously selected file

      // Map translations for the form, ensuring all required locales are present and ordered
      const locales = ["en", "ar", "fa"]; // Define required locales
      const initialTranslations: GalleryFormValues["translations"] =
        locales.map((locale) => {
          const existingTranslation = Array.isArray(galleryItem.translations)
            ? galleryItem.translations.find((t) => t.locale === locale)
            : undefined;

          return {
            locale: locale,
            title: existingTranslation?.title || "",
            description: existingTranslation?.description || "",
          };
        });

      form.reset({
        image: galleryItem.image,
        category: galleryItem.category,
        translations: initialTranslations,
      });
    } else {
      // Reset form and image states if galleryItem is null
      form.reset({
        image: "",
        category: "",
        translations: [
          { locale: "en", title: "", description: "" },
          { locale: "ar", title: "", description: "" },
          { locale: "fa", title: "", description: "" },
        ],
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [galleryItem, form]);

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
    if (!galleryItem) return;

    setIsSubmitting(true);
    toast({
      title: "Updating gallery item...!",
      description: "Please wait while we save your changes.",
    });

    const formData = new FormData();

    // Append text fields
    formData.append("category", values.category);
    formData.append("translations", JSON.stringify(values.translations));

    // Append image file if a new one is selected
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imagePreview === null) {
      // If image was removed (preview is null), send an empty string to signal removal.
      formData.append("image", "");
    }
    // If the image preview is still there and no new file is selected,
    // it means the user wants to keep the existing image. In this case,
    // we don't append anything for the 'image' field, and the backend
    // should interpret its absence as "no change to the image".

    try {
      const res = await fetch(`/api/gallery/${galleryItem.id}`, {
        method: "PUT",
        body: formData, // Use FormData for file uploads
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update gallery item.");
      }

      toast({
        title: "Success",
        description: "Gallery item updated successfully!",
      });
      onUpdateSuccessAction();
      onOpenChangeAction(false);
    } catch (error) {
      console.error("Failed to update gallery item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while updating the gallery item.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCategories = React.useMemo(() => {
    const allCategories = new Set(categories || []);
    if (galleryItem?.category) {
      allCategories.add(galleryItem.category);
    }
    return Array.from(allCategories);
  }, [categories, galleryItem]);

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    }
    onOpenChangeAction(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Gallery Item</SheetTitle>
          <SheetDescription>
            Make changes to your gallery item here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="space-y-4 px-4 py-6">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <div className="space-y-4 rounded-lg border p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Could not load gallery data."}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    disabled={isLoading}
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
                    <div className="flex items-center gap-2">
                      <Select
                        key={field.value}
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {displayCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog
                        open={isCategoryDialogOpen}
                        onOpenChange={setIsCategoryDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                              Create a new category for your gallery items.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Input
                              placeholder="Category name"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (!newCategory.trim()) return;
                                form.setValue("category", newCategory);
                                setNewCategory("");
                                setIsCategoryDialogOpen(false);
                                toast({
                                  title: "Category set",
                                  description: `The new category "${newCategory}" will be saved when you update the item.`,
                                });
                              }}
                            >
                              Set Category
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {field.value && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                            >
                              <DeleteIcon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Category</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete the category "
                                {field.value}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <Label htmlFor="replacement-category">
                                Replace with
                              </Label>
                              <Select
                                onValueChange={setReplacementCategory}
                                value={replacementCategory}
                              >
                                <SelectTrigger id="replacement-category">
                                  <SelectValue placeholder="Select a replacement category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {displayCategories
                                    .filter(
                                      (category) => category !== field.value,
                                    )
                                    .map((category) => (
                                      <SelectItem
                                        key={category}
                                        value={category}
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-muted-foreground">
                                All items with the category "{field.value}" will
                                be reassigned to the selected category. If no
                                category is selected, the category will be
                                removed from the items.
                              </p>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  (
                                    document.querySelector(
                                      "[data-radix-dialog-overlay]",
                                    ) as HTMLElement
                                  )?.click()
                                }
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/gallery/categories/${encodeURIComponent(
                                        field.value,
                                      )}`,
                                      {
                                        method: "DELETE",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          replacementCategory,
                                        }),
                                      },
                                    );
                                    if (!res.ok) {
                                      throw new Error(
                                        "Failed to delete category",
                                      );
                                    }
                                    await refetchCategories();
                                    form.setValue("category", "");
                                    setReplacementCategory("");
                                    toast({
                                      title: "Success",
                                      description: "Category deleted!",
                                    });
                                  } catch (error) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description:
                                        "Failed to delete category.",
                                    });
                                  } finally {
                                    (
                                      document.querySelector(
                                        "[data-radix-dialog-overlay]",
                                      ) as HTMLElement
                                    )?.click();
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
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
                        <Select value={field.value} disabled>
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
                          <Input
                            placeholder="Title"
                            {...field}
                            disabled={isLoading}
                          />
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
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Update Gallery Item"
                )}
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
