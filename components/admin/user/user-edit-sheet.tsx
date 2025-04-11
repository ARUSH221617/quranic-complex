"use client";

import * as React from "react";
import { QuranicStudyLevel, User, UserStatus } from "@prisma/client";
import { RefreshCwIcon, Trash, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ImageCropModal } from "./image-crop-modal";
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
import { useToast } from "@/hooks/use-toast";
import { userSchema } from "./schema";
import { Separator } from "@/components/ui/separator"; // Import Separator

// Define the schema for the edit form (subset of userSchema, make fields optional for PATCH)
const editUserFormSchema = userSchema.partial().omit({ id: true });
type EditUserFormData = z.infer<typeof editUserFormSchema>;

interface UserEditSheetProps {
  user: User | null;
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onUpdateSuccessAction: () => void;
}

export function UserEditSheet({
  user,
  isOpen,
  onOpenChangeAction,
  onUpdateSuccessAction,
}: UserEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [nationalCardFile, setNationalCardFile] = React.useState<File | null>(
    null,
  );
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [nationalCardPreview, setNationalCardPreview] = React.useState<
    string | null
  >(null);
  const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);

  type FormTextFields = Omit<
    EditUserFormData,
    "image" | "nationalCardPicture" | "dateOfBirth"
  > & {
    dateOfBirth?: string;
  };

  const form = useForm<FormTextFields>({
    mode: "onSubmit",
    defaultValues: {},
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "",
        nationalCode: user.nationalCode ?? "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : undefined,
        quranicStudyLevel: user.quranicStudyLevel ?? undefined,
        status: user.status ?? undefined,
      });
      setImageFile(null);
      setNationalCardFile(null);
      setImagePreview(null);
      setNationalCardPreview(null);
      setImageToCrop(null);
      setCropModalOpen(false);
    } else {
      form.reset({});
      setImageFile(null);
      setNationalCardFile(null);
      setImagePreview(null);
      setNationalCardPreview(null);
      setImageToCrop(null);
      setCropModalOpen(false);
    }
  }, [user, form]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    isProfilePicture: boolean = false,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PNG or JPG image.",
        });
        setPreview(null);
        setFile(null);
        event.target.value = "";
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
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isProfilePicture) {
          setImageToCrop(result);
          setCropModalOpen(true);
          event.target.value = "";
        } else {
          setPreview(result);
          setFile(file);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (isProfilePicture) {
        setImageToCrop(null);
      }
      setPreview(null);
      setFile(null);
    }
  };

  const handleSaveCroppedImage = (croppedBlob: Blob | null) => {
    if (croppedBlob) {
      const croppedFile = new File(
        [croppedBlob],
        imageFile?.name || "cropped-image.jpg",
        {
          type: croppedBlob.type,
          lastModified: Date.now(),
        },
      );
      setImageFile(croppedFile);
      const previewUrl = URL.createObjectURL(croppedBlob);
      setImagePreview((currentPreview) => {
        if (currentPreview && currentPreview.startsWith("blob:")) {
          URL.revokeObjectURL(currentPreview); // Revoke previous blob URL if exists
        }
        return previewUrl; // Set the new preview URL
      });
      // Clean up the original, uncropped image source if it was a blob URL
      if (imageToCrop && imageToCrop.startsWith("blob:")) {
        URL.revokeObjectURL(imageToCrop);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
    setImageToCrop(null);
    setCropModalOpen(false);
  };

  const handleImageRemove = (
    setFileState: React.Dispatch<React.SetStateAction<File | null>>,
    setPreviewState: React.Dispatch<React.SetStateAction<string | null>>,
    inputId: string,
  ) => {
    setFileState(null);
    setPreviewState((currentPreview) => {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return null;
    });
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  async function onSubmit(data: FormTextFields) {
    if (!user) return;

    setIsSubmitting(true);
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    });

    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (nationalCardFile) {
      formData.append("nationalCardPicture", nationalCardFile);
    }
    // Explicitly check for status to allow setting it even if undefined initially
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
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText || "Update failed" };
        }
        throw new Error(errorData.message || "Failed to update user.");
      }

      toast({
        title: "Success",
        description: "User updated successfully!",
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

  const sendVerificationEmail = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/verify-email`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send verification email");
      toast({
        title: "Success",
        description: "Verification email sent",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send email",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="gap-1 pr-6">
          {" "}
          {/* Added pr-6 to avoid overlap with close button */}
          <SheetTitle>Edit User: {user?.name || user?.id}</SheetTitle>
          <SheetDescription>
            Modify user details. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" /> {/* Separator after header */}
        <Form {...form}>
          {/* Changed to space-y-6 for better section separation */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col space-y-6 overflow-y-auto px-1 py-2" /* Added px/py */
          >
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Basic Information
              </h3>
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
                        disabled={!!user?.emailVerified} // Disable if email is verified
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!user?.emailVerified &&
                user?.email && ( // Show verify button only if email exists and not verified
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={sendVerificationEmail}
                    className="w-full text-xs"
                    size="sm"
                  >
                    Send Verification Email
                  </Button>
                )}
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
            </div>

            <Separator />

            {/* Account Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Account Details
              </h3>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined} // Ensure value is controlled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined} // Ensure value is controlled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UserStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Personal Details
              </h3>
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
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
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
                      value={field.value ?? undefined} // Ensure value is controlled
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
            </div>

            <Separator />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Images
              </h3>
              {/* Profile Picture */}
              <div className="space-y-2 rounded-md border border-dashed p-4">
                <Label htmlFor="image" className="block text-sm font-medium">
                  Profile Picture
                </Label>
                {/* Preview and Actions Container */}
                {imagePreview || user?.image ? (
                  <div className="relative mt-2 flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-gray-300 overflow-hidden group transition duration-200 hover:shadow-lg">
                    <Image
                      src={imagePreview || user?.image || ""}
                      alt="Profile Picture Preview"
                      width={96}
                      height={96}
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-50 flex items-center justify-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive" // Changed to destructive for remove
                          onClick={() =>
                            handleImageRemove(
                              setImageFile,
                              setImagePreview,
                              "image",
                            )
                          }
                          className="h-8 w-8 p-1 rounded-full" // Made button round
                          aria-label="Remove image"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            document.getElementById("image")?.click()
                          }
                          className="h-8 w-8 p-1 rounded-full" // Made button round
                          aria-label="Change image"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                    <div className="text-center">
                      {/* SVG or Icon placeholder */}
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <Label
                          htmlFor="image"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/90"
                        >
                          <span>Upload a file</span>
                          <Input
                            id="image"
                            type="file"
                            className="sr-only" // Hide default input, label triggers it
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setImageFile,
                                setImagePreview,
                                true,
                              )
                            }
                          />
                        </Label>
                        <p className="pl-1">or drag and drop</p>{" "}
                        {/* Drag/drop not implemented, just text */}
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {imagePreview || user?.image
                    ? "Click edit to change or trash to remove."
                    : "Leave blank to keep current image."}
                </p>
              </div>

              {/* National Card Picture */}
              <div className="space-y-2 rounded-md border border-dashed p-4">
                <Label
                  htmlFor="nationalCardPicture"
                  className="block text-sm font-medium"
                >
                  National Card Picture
                </Label>
                {/* Preview and Actions */}
                {nationalCardPreview || user?.nationalCardPicture ? (
                  <div className="relative mt-2 flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 overflow-hidden group transition duration-200 hover:shadow-lg">
                    <Image
                      src={
                        nationalCardPreview || user?.nationalCardPicture || ""
                      }
                      alt="National Card Preview"
                      layout="fill" // Use fill layout
                      objectFit="contain" // Ensure the whole image is visible
                      className="transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-50 flex items-center justify-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive" // Changed to destructive
                          onClick={() =>
                            handleImageRemove(
                              setNationalCardFile,
                              setNationalCardPreview,
                              "nationalCardPicture",
                            )
                          }
                          className="h-8 w-8 p-1 rounded-full" // Made round
                          aria-label="Remove national card image"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            document
                              .getElementById("nationalCardPicture")
                              ?.click()
                          }
                          className="h-8 w-8 p-1 rounded-full" // Made round
                          aria-label="Change national card image"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                    <div className="text-center">
                      {/* SVG or Icon placeholder */}
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <Label
                          htmlFor="nationalCardPicture"
                          className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/90"
                        >
                          <span>Upload a file</span>
                          <Input
                            id="nationalCardPicture"
                            type="file"
                            className="sr-only" // Hide default input
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setNationalCardFile,
                                setNationalCardPreview,
                                false,
                              )
                            }
                          />
                        </Label>
                        <p className="pl-1">or drag and drop</p>{" "}
                        {/* Drag/drop not implemented, just text */}
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {nationalCardPreview || user?.nationalCardPicture
                    ? "Click edit to change or trash to remove."
                    : "Leave blank to keep current picture."}
                </p>
              </div>
            </div>

            {/* Submit Button is pushed down by the footer */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && (
                <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
        {/* Crop Modal */}
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={imageToCrop}
          onClose={() => {
            setCropModalOpen(false);
            // Clean up blob URL if modal is closed without saving
            if (imageToCrop && imageToCrop.startsWith("blob:")) {
              URL.revokeObjectURL(imageToCrop);
            }
            setImageToCrop(null);
          }}
          onSaveCroppedImage={handleSaveCroppedImage}
        />
        {/* Footer with Cancel button */}
        <SheetFooter className="mt-auto pt-6">
          {" "}
          {/* Added pt-6 */}
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
