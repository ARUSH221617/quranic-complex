"use client";

import * as React from "react";
import { RefreshCwIcon, Trash, Edit } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { programSchema, ProgramData } from "./schema"; // Import ProgramData and programSchema
import { Separator } from "@/components/ui/separator";

// Define the schema for the edit form (subset of programSchema, make fields optional for PATCH)
// Ensure all fields match the ProgramData type expected by the form
const editProgramFormSchema = programSchema.partial().omit({ id: true });
type EditProgramFormData = z.infer<typeof editProgramFormSchema>;

interface ProgramEditSheetProps {
  // Change Program to ProgramData
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

  // Ensure form type matches the schema fields
  const form = useForm<EditProgramFormData>({
    mode: "onSubmit",
    defaultValues: {},
  });

  React.useEffect(() => {
    if (program) {
      // Reset form with program data
      form.reset({
        title: program.title ?? "",
        slug: program.slug ?? "",
        description: program.description ?? "",
        ageGroup: program.ageGroup ?? "",
        schedule: program.schedule ?? "",
        // image is handled separately
      });
      setImageFile(null);
      // Set initial image preview from program data if it exists
      setImagePreview(program.image || null);
    } else {
      form.reset({});
      setImageFile(null);
      setImagePreview(null);
    }
    // Reset image file input when sheet closes or program changes
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, [program, form, isOpen]); // Add isOpen dependency to reset on reopen

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

    // Append text data - only send changed values
    Object.entries(data).forEach(([key, value]) => {
      // Check if the value exists and is different from the original program value
      // Need to handle type differences (e.g., form gives string, program might have null)
      const originalValue = program[key as keyof ProgramData];
      if (
        value !== undefined &&
        value !== null &&
        String(value) !== String(originalValue ?? "")
      ) {
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
    // If imagePreview is not null and matches the original program image, and no new file selected,
    // then the image wasn't changed, so don't send anything image-related.

    // Check if any data actually changed
    let hasChanges = false;
    formData.forEach(() => {
      hasChanges = true;
    }); // Check if formData has any entries

    if (!hasChanges) {
      toast({ title: "No Changes", description: "No modifications detected." });
      setIsSubmitting(false);
      onOpenChangeAction(false); // Optionally close sheet if no changes
      return;
    }

    toast({
      title: "Updating program...",
      description: `Saving changes for ${program.title || program.id}`,
    });

    try {
      // Assuming API endpoint structure /api/programs/{id}
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/programs/${program.id}`,
        {
          method: "PATCH",
          body: formData, // Send FormData directly
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

      const updatedProgram = await response.json(); // Get updated data

      toast({ title: "Success", description: "Program updated successfully!" });
      onUpdateSuccessAction(); // Callback to refresh data in the table
      onOpenChangeAction(false); // Close the sheet
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
              <h3 className="text-sm font-medium text-muted-foreground">
                Program Details
              </h3>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Program Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="program-slug" {...field} />
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
                    {/* Ensure field.value is treated as string for Textarea */}
                    <FormControl>
                      <Textarea
                        placeholder="Program Description"
                        {...field}
                        value={field.value ?? ""}
                        rows={4}
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
                      <Input placeholder="e.g., Adults, Kids 5-7" {...field} />
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
                      <Input placeholder="e.g., Mon & Wed 6-8 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
