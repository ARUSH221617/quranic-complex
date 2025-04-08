"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuranicStudyLevel, User } from "@prisma/client";
import { RefreshCwIcon, Trash, Edit } from "lucide-react"; // Import Trash and Edit icons
import { useForm } from "react-hook-form";
import Image from "next/image"; // Import Next Image
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ImageCropModal } from "./image-crop-modal"; // Import the crop modal
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"; // Keep Input
import { Label } from "@/components/ui/label"; // Add Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import { userSchema } from "./schema";

// Define the schema for the edit form (subset of userSchema, make fields optional for PATCH)
// We don't use zod for the form itself now because of file inputs, but keep types
const editUserFormSchema = userSchema.partial().omit({ id: true });
type EditUserFormData = z.infer<typeof editUserFormSchema>; // Keep for type hints

interface UserEditSheetProps {
  user: User | null; // User data to edit, or null if sheet is closed
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateSuccess: () => void; // Callback to refetch data in parent
}

export function UserEditSheet({
  user,
  isOpen,
  onOpenChange,
  onUpdateSuccess,
}: UserEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast(); // Get toast function
  // State for file inputs
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [nationalCardFile, setNationalCardFile] = React.useState<File | null>(
    null
  );
  // State for image previews
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [nationalCardPreview, setNationalCardPreview] = React.useState<
    string | null
  >(null);
  // State for crop modal
  const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);

  // Define type for form data excluding files, explicitly setting dateOfBirth as string
  type FormTextFields = Omit<
    EditUserFormData,
    "image" | "nationalCardPicture" | "dateOfBirth"
  > & {
    dateOfBirth?: string; // Expect string for date input
  };

  // Use react-hook-form for text fields, handle files separately
  const form = useForm<FormTextFields>({
    // No resolver needed here as we handle files manually
    mode: "onSubmit",
    defaultValues: {}, // Default values are set in useEffect
  });

  // Reset form when user data changes, but NOT file inputs
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "",
        nationalCode: user.nationalCode ?? "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0] // Format for date input
          : undefined,
        quranicStudyLevel: user.quranicStudyLevel ?? undefined,
      });
      // Reset file, preview, and crop states when sheet opens for a new user
      setImageFile(null);
      setNationalCardFile(null);
      setImagePreview(null);
      setNationalCardPreview(null);
      setImageToCrop(null); // Reset image to crop
      setCropModalOpen(false); // Ensure modal is closed
    } else {
      form.reset({}); // Reset if no user
      setImageFile(null);
      setNationalCardFile(null);
      setImagePreview(null);
      setNationalCardPreview(null);
      setImageToCrop(null);
      setCropModalOpen(false);
    }
  }, [user, form]); // Rerun when user changes

  // Handle file input changes with preview (and cropping for profile image)
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    isProfilePicture: boolean = false // Flag to trigger cropping
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic client-side validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PNG or JPG image.",
        });
        setPreview(null);
        setFile(null);
        event.target.value = ""; // Clear the input visually
        // form.setError(fieldName, { type: "manual", message: "Invalid type" });
        return;
      }
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be less than 5MB.",
        });
        setPreview(null);
        setFile(null);
        event.target.value = ""; // Clear the input visually
        // form.setError(fieldName, { type: "manual", message: "Too large" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isProfilePicture) {
          // Open crop modal instead of setting file/preview directly
          setImageToCrop(result);
          setCropModalOpen(true);
          // Clear the file input visually after selection so the same file can be re-selected if needed
          event.target.value = "";
        } else {
          // For non-profile pictures (national card), set directly
          setPreview(result);
          setFile(file);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Clear relevant states if no file is selected
      if (isProfilePicture) {
        setImageToCrop(null);
      }
      // Always clear preview and file state
      setPreview(null);
      setFile(null);
    }
  };

  // Handle saving the cropped image
  const handleSaveCroppedImage = (croppedBlob: Blob | null) => {
    if (croppedBlob) {
      // Convert blob to file
      const croppedFile = new File(
        [croppedBlob],
        imageFile?.name || "cropped-image.jpg",
        {
          type: croppedBlob.type,
          lastModified: Date.now(),
        }
      );
      setImageFile(croppedFile); // Set the cropped file for upload
      // Create a new object URL for the preview
      const previewUrl = URL.createObjectURL(croppedBlob);
      setImagePreview(previewUrl); // Update preview to show cropped image
      // Clean up previous object URL if it exists to prevent memory leaks
      if (imageToCrop && imageToCrop.startsWith("blob:")) {
        URL.revokeObjectURL(imageToCrop);
      }
    } else {
      // Handle case where cropping failed or was cancelled implicitly
      setImageFile(null);
      setImagePreview(null);
    }
    setImageToCrop(null); // Clear the image source for the modal
    setCropModalOpen(false); // Close the modal
  };

  // Handle image removal (now needs to handle preview state too)
  const handleImageRemove = (
    setFileState: React.Dispatch<React.SetStateAction<File | null>>,
    setPreviewState: React.Dispatch<React.SetStateAction<string | null>>,
    inputId: string
  ) => {
    setFileState(null);
    // Revoke object URL if the preview was from a blob
    setPreviewState((currentPreview) => {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return null; // Set preview to null
    });
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Clear the file input visually
    }
    // form.resetField(fieldName); // If using RHF for file field
  };

  // Updated onSubmit to handle FormData, expecting FormTextFields type
  async function onSubmit(data: FormTextFields) {
    // console.log("onSubmit triggered", data); // <-- Removed debug log
    if (!user) return;

    setIsSubmitting(true);
    const formData = new FormData();

    // Append text fields from react-hook-form data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append files if they exist
    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (nationalCardFile) {
      formData.append("nationalCardPicture", nationalCardFile);
    }
    // Append status if it exists
    if (data.status) {
      formData.append("status", data.status);
    }

    toast({
      title: "Updating user...",
      description: `Saving changes for ${user.name || user.id}`,
    });

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        // Don't set Content-Type header, browser does it for FormData
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Handle cases where response is not JSON
          errorData = { message: response.statusText || "Update failed" };
        }
        throw new Error(errorData.message || "Failed to update user.");
      }

      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      onUpdateSuccess(); // Trigger refetch in the parent component
      onOpenChange(false); // Close the sheet
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>Edit User: {user?.name || user?.id}</SheetTitle>
          <SheetDescription>
            Modify the user details below and click save.
          </SheetDescription>
        </SheetHeader>
        {/* Restore Form provider wrapper */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto py-4"
          >
            {/* Keep FormField for structure and potential future use */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Full Name"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Phone Number"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Add roles as needed */}
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="STUDENT">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nationalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="National ID Code"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Date of Birth Input */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    {/* Ensure value passed to Input is always string or empty string */}
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quranicStudyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quranic Study Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select study level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(QuranicStudyLevel).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!user?.emailVerified && (
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/users/${user?.id}/verify-email`,
                      {
                        method: "POST",
                      }
                    );
                    if (!res.ok)
                      throw new Error("Failed to send verification email");
                    toast({
                      title: "Success",
                      description: "Verification email sent",
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to send email",
                    });
                  }
                }}
                className="w-full"
              >
                Send Verification Email
              </Button>
            )}

            {/* Image Upload - Styled like registration */}
            <div className="space-y-2">
              <Label htmlFor="image">Profile Picture</Label>
              <Input
                id="image"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                // Pass true for isProfilePicture to trigger cropping
                onChange={(e) =>
                  handleFileChange(e, setImageFile, setImagePreview, true)
                }
                className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 border-gray-300 ${
                  imagePreview || user?.image ? "hidden" : "" // Hide input when preview or existing image is shown
                }`}
              />
              {/* Preview and Actions */}
              {(imagePreview || user?.image) && (
                <div className="relative mt-2 flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-gray-300 overflow-hidden group transition duration-200 hover:shadow-lg">
                  <Image
                    src={imagePreview || user?.image || ""} // Show preview first, then existing, then fallback (shouldn't happen)
                    alt="Profile Picture Preview"
                    width={96} // Size of container
                    height={96}
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-40 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="outline"
                        // Pass correct state setters to remove handler
                        onClick={() =>
                          handleImageRemove(
                            setImageFile,
                            setImagePreview,
                            "image"
                          )
                        }
                        className="h-8 w-8 p-1"
                        aria-label="Remove image"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      {/* Change Button */}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          document.getElementById("image")?.click()
                        }
                        className="h-8 w-8 p-1"
                        aria-label="Change image"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Max 5MB (PNG, JPG). Leave blank or remove to keep current image.
              </p>
            </div>

            {/* National Card Picture Upload - Apply similar styling */}
            <div className="space-y-2">
              <Label htmlFor="nationalCardPicture">National Card Picture</Label>
              <Input
                id="nationalCardPicture"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                // Do not trigger cropping for national card
                onChange={(e) =>
                  handleFileChange(
                    e,
                    setNationalCardFile,
                    setNationalCardPreview,
                    false
                  )
                }
                className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 border-gray-300 ${
                  nationalCardPreview || user?.nationalCardPicture
                    ? "hidden"
                    : "" // Hide input when preview or existing image is shown
                }`}
              />
              {/* Preview and Actions */}
              {(nationalCardPreview || user?.nationalCardPicture) && (
                <div className="relative mt-2 flex h-40 items-center justify-center border border-dashed border-gray-300 rounded-lg overflow-hidden group transition duration-200 hover:shadow-lg">
                  <Image
                    src={nationalCardPreview || user?.nationalCardPicture || ""} // Show preview first, then existing
                    alt="National Card Preview"
                    width={150} // Adjust size as needed
                    height={150}
                    className="object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-40 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="outline"
                        // Pass correct state setters to remove handler
                        onClick={() =>
                          handleImageRemove(
                            setNationalCardFile,
                            setNationalCardPreview,
                            "nationalCardPicture"
                          )
                        }
                        className="h-8 w-8 p-1"
                        aria-label="Remove national card image"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      {/* Change Button */}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          document
                            .getElementById("nationalCardPicture")
                            ?.click()
                        }
                        className="h-8 w-8 p-1"
                        aria-label="Change national card image"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Max 5MB (PNG, JPG). Leave blank or remove to keep current
                picture.
              </p>
            </div>

            {/* Submit Button (back inside form, no explicit onClick needed now) */}
            <Button type="submit" disabled={isSubmitting} className="mt-4">
              {isSubmitting && (
                <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>{" "}
        {/* Close Form provider wrapper */}
        {/* Render the Crop Modal */}
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={imageToCrop}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCrop(null); // Clear image source if modal is closed without saving
          }}
          onSaveCroppedImage={handleSaveCroppedImage}
        />
        {/* Keep Cancel button in footer for layout */}
        <SheetFooter className="mt-auto pt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
