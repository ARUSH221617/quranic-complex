"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QuranicStudyLevel } from "@prisma/client"; // Import enum
import { Button } from "@/components/ui/button"; // Corrected import path casing to lowercase 'b'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image"; // Import Next Image
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import {
  FormField,
  FormControl,
  FormItem,
  FormMessage,
} from "@/components/ui/form"; // Import Form components
import { Trash, Edit } from "lucide-react"; // Import icons
import { useTranslations } from "next-intl";

// Define Zod schema for client-side validation
const registerFormSchema = z
  .object({
    name: z.string().min(1, { message: "nameRequired" }), // Use translation keys
    email: z.string().email({ message: "invalidEmail" }),
    password: z.string().min(6, { message: "passwordMinLength" }),
    confirmPassword: z.string().min(6, { message: "passwordMinLength" }),
    phone: z.string().optional(),
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "invalidDateFormat",
    }),
    nationalCode: z
      .string()
      .length(10, { message: "nationalCodeLength" })
      .regex(/^\d+$/, { message: "nationalCodeNumeric" }),
    quranicStudyLevel: z.nativeEnum(QuranicStudyLevel, {
      errorMap: () => ({ message: "quranicLevelRequired" }),
    }),
    // Keep optional for now, UI handles preview/removal logic. Adjust if requirement changes.
    nationalCardPicture: z.instanceof(FileList).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"], // Set error path for password mismatch
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const t = useTranslations("home.auth.register");
  // const tCommon = useTranslations('common'); // Add if common translations are needed
  const router = useRouter();
  const [apiMessage, setApiMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null); // For API success/error messages
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // State to track successful registration
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview URL

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      dateOfBirth: "",
      nationalCode: "",
      // quranicStudyLevel: undefined, // Let placeholder handle initial state
      // nationalCardPicture: undefined,
    },
  });

  // Handler for image selection
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type client-side (optional but recommended)
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        form.setError("nationalCardPicture", {
          type: "manual",
          message: t("invalidImageType"),
        }); // Need translation key: invalidImageType
        setImagePreview(null);
        form.resetField("nationalCardPicture");
        return;
      }
      // Validate file size client-side (optional but recommended)
      const maxSize = 5 * 1024 * 1024; // 5MB example limit
      if (file.size > maxSize) {
        form.setError("nationalCardPicture", {
          type: "manual",
          message: t("imageTooLarge", { size: "5MB" }),
        }); // Need translation key: imageTooLarge
        setImagePreview(null);
        form.resetField("nationalCardPicture");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Set the FileList in the form state, ensuring it's not null
        if (event.target.files) {
          form.setValue("nationalCardPicture", event.target.files, {
            shouldValidate: true,
          });
        } else {
          form.resetField("nationalCardPicture"); // Reset if files are null
        }
        form.clearErrors("nationalCardPicture"); // Clear previous errors on successful upload
      };
      reader.readAsDataURL(file);
    } else {
      // Clear preview if no file selected (e.g., user cancels)
      setImagePreview(null);
      form.resetField("nationalCardPicture");
    }
  };

  // Handler for removing the selected image
  const handleImageRemove = () => {
    setImagePreview(null);
    form.resetField("nationalCardPicture"); // Reset the field value in the form
    // Optionally clear the file input visually if needed, though resetting the field should suffice
    const fileInput = document.getElementById(
      "nationalCardPicture"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setApiMessage(null); // Clear previous messages

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password); // Send password for backend hashing
    if (data.phone) formData.append("phone", data.phone);
    formData.append("dateOfBirth", data.dateOfBirth);
    formData.append("nationalCode", data.nationalCode);
    formData.append("quranicStudyLevel", data.quranicStudyLevel);

    // Append file if it exists
    if (data.nationalCardPicture && data.nationalCardPicture.length > 0) {
      formData.append("nationalCardPicture", data.nationalCardPicture[0]);
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        // Headers removed for FormData, browser sets Content-Type automatically
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific API errors (e.g., email exists)
        setApiMessage({
          type: "error",
          text: result.message || t("registrationFailed"),
        }); // Use translated fallback
      } else {
        // Registration successful - API sent verification email
        setIsSuccess(true); // Set success state
        setApiMessage({
          type: "success",
          text: result.message || t("registrationSuccessCheckEmail"),
        }); // Display success message from API
        // No redirect here - user stays on page to see the message
      }
    } catch (error) {
      console.error("Registration submission error:", error);
      setApiMessage({ type: "error", text: t("networkError") }); // Use translated network error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {" "}
      {/* Adjusted background */}
      <Card className="w-full max-w-lg">
        {" "}
        {/* Increased max-width */}
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{t("title")}</CardTitle>
          <CardDescription>
            {isSuccess ? t("checkEmailSubtitle") : t("subtitle")}{" "}
            {/* Change subtitle on success */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display Success Message or Form */}
          {isSuccess ? (
            <div className="rounded-md bg-green-100 p-4 text-center">
              <p className="text-sm font-medium text-green-800">
                {apiMessage?.text}
              </p>
              <p className="mt-2 text-sm text-green-700">
                {t("verificationEmailSentInfo")}{" "}
                {/* Add translation key: verificationEmailSentInfo */}
              </p>
              <Button variant="outline" asChild className="mt-4">
                {" "}
                {/* Changed variant to "outline" */}
                <Link href="/auth/login">{t("goToLogin")}</Link>{" "}
                {/* Add translation key: goToLogin */}
              </Button>
            </div>
          ) : (
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Display API Error Message */}
                {apiMessage && apiMessage.type === "error" && (
                  <div className="rounded-md bg-red-100 p-3">
                    <p className="text-sm text-red-700">{apiMessage.text}</p>
                  </div>
                )}
                {/* Name Field */}
                <div>
                  <Label htmlFor="name">{t("nameLabel")}</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    {...form.register("name")}
                    className={
                      form.formState.errors.name ? "border-red-500" : ""
                    }
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(form.formState.errors.name.message as string)}
                    </p>
                  )}
                </div>
                {/* Email Field */}
                <div>
                  <Label htmlFor="email">{t("emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...form.register("email")}
                    className={
                      form.formState.errors.email ? "border-red-500" : ""
                    }
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(form.formState.errors.email.message as string)}
                    </p>
                  )}
                </div>
                {/* Password Field */}
                <div>
                  <Label htmlFor="password">{t("passwordLabel")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...form.register("password")}
                    className={
                      form.formState.errors.password ? "border-red-500" : ""
                    }
                  />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(form.formState.errors.password.message as string)}
                    </p>
                  )}
                </div>
                {/* Confirm Password Field */}
                <div>
                  <Label htmlFor="confirmPassword">
                    {t("confirmPasswordLabel")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...form.register("confirmPassword")}
                    className={
                      form.formState.errors.confirmPassword
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(
                        form.formState.errors.confirmPassword.message as string
                      )}
                    </p>
                  )}
                </div>
                {/* Phone Field (Optional) */}
                <div>
                  <Label htmlFor="phone">
                    {t("phoneLabel")} ({t("optional")})
                  </Label>{" "}
                  {/* Add optional text */}
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...form.register("phone")}
                    className={
                      form.formState.errors.phone ? "border-red-500" : ""
                    }
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(form.formState.errors.phone.message as string)}
                    </p>
                  )}
                </div>
                {/* Date of Birth Field */}
                <div>
                  <Label htmlFor="dateOfBirth">{t("dateOfBirthLabel")}</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                    className={
                      form.formState.errors.dateOfBirth ? "border-red-500" : ""
                    }
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(form.formState.errors.dateOfBirth.message as string)}
                    </p>
                  )}
                </div>
                {/* National Code Field */}
                <div>
                  <Label htmlFor="nationalCode">{t("nationalCodeLabel")}</Label>
                  <Input
                    id="nationalCode"
                    type="text" // Use text to allow leading zeros if necessary, validation handles numeric check
                    maxLength={10}
                    {...form.register("nationalCode")}
                    className={
                      form.formState.errors.nationalCode ? "border-red-500" : ""
                    }
                  />
                  {form.formState.errors.nationalCode && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(form.formState.errors.nationalCode.message as string)}
                    </p>
                  )}
                </div>
                {/* Level of Quranic Studies Field */}
                <div>
                  <Label htmlFor="quranicStudyLevel">
                    {t("quranicLevelLabel")}
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue(
                        "quranicStudyLevel",
                        value as QuranicStudyLevel
                      )
                    }
                    defaultValue={form.getValues("quranicStudyLevel")}
                  >
                    <SelectTrigger
                      className={
                        form.formState.errors.quranicStudyLevel
                          ? "border-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder={t("selectLevelPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {Object.values(QuranicStudyLevel).map((level) => (
                        <SelectItem key={level} value={level}>
                          {t(`quranicLevels.${level}`)}{" "}
                          {/* Use translation keys for levels */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.quranicStudyLevel && (
                    <p className="mt-1 text-xs text-red-600">
                      {t(
                        form.formState.errors.quranicStudyLevel
                          .message as string
                      )}
                    </p>
                  )}
                </div>
                {/* National Card Picture Field - Improved UI */}
                <FormField
                  control={form.control}
                  name="nationalCardPicture"
                  render={(
                    { field } // field contains { onChange, onBlur, value, name, ref } but we handle onChange manually
                  ) => (
                    <FormItem>
                      <Label htmlFor="nationalCardPicture">
                        {t("nationalCardLabel")}
                      </Label>
                      <FormControl>
                        <Input
                          id="nationalCardPicture" // Keep ID for label association
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleImageUpload} // Use custom handler
                          // {...form.register("nationalCardPicture")} // Remove direct register, handled by setValue
                          className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 ${
                            form.formState.errors.nationalCardPicture
                              ? "border-red-500"
                              : "border-gray-300"
                          } ${imagePreview ? "hidden" : ""}`} // Hide input when preview is shown
                        />
                        {/* Display error message */}
                      </FormControl>
                      {form.formState.errors.nationalCardPicture &&
                        !imagePreview && (
                          <p className="mt-1 text-xs text-red-600">
                            {t(
                              form.formState.errors.nationalCardPicture
                                .message as string
                            )}
                          </p>
                        )}
                      {/* Image Preview and Actions */}
                      {imagePreview && (
                        <div className="relative mt-2 h-40 flex items-center justify-center border border-dashed border-gray-300 rounded-lg overflow-hidden group transition duration-200 hover:shadow-lg">
                          <Image
                            src={imagePreview}
                            alt={t("nationalCardPreviewAlt", {
                              defaultValue: "National Card Preview",
                            })} // Need translation key: nationalCardPreviewAlt
                            width={150} // Adjust size as needed
                            height={150}
                            className="object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-40">
                            <div className="absolute bottom-2 left-2 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              {/* Adjusted Remove Button */}
                              <Button
                                type="button"
                                variant="outline" // Changed from destructive
                                // size="icon" // Removed unsupported size
                                onClick={handleImageRemove}
                                className="h-8 w-8 p-1" // Added padding for icon spacing
                                aria-label={t("removeImageAriaLabel", {
                                  defaultValue: "Remove image",
                                })}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                              {/* Adjusted Change Button */}
                              <Button
                                type="button"
                                variant="secondary"
                                // size="icon" // Removed unsupported size
                                onClick={() =>
                                  document
                                    .getElementById("nationalCardPicture")
                                    ?.click()
                                } // Trigger hidden input click
                                className="h-8 w-8 p-1" // Added padding for icon spacing
                                aria-label={t("changeImageAriaLabel", {
                                  defaultValue: "Change image",
                                })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {/* Display error message below preview if needed */}
                          {form.formState.errors.nationalCardPicture && (
                            <p className="absolute bottom-1 right-1 text-xs text-red-500 bg-white px-1 rounded">
                              {t(
                                form.formState.errors.nationalCardPicture
                                  .message as string
                              )}
                            </p>
                          )}
                        </div>
                      )}
                      {/* Ensure FormMessage is rendered if needed, though manual display is added */}
                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
                {/* Submit Button */}
                <div className="pt-2">
                  {" "}
                  {/* Added padding top */}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {" "}
                    {/* Removed specific bg color to use default */}
                    {isLoading ? t("registeringProgress") : t("register")}
                  </Button>
                </div>
              </form>
            </FormProvider>
          )}
        </CardContent>
        {/* Hide footer link if registration was successful */}
        {!isSuccess && (
          <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-gray-600">
              {t("hasAccount")}{" "}
              <Link
                href={`/auth/login`}
                className="font-medium text-primary hover:underline"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
