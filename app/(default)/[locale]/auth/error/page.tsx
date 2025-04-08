"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function AuthErrorPage() {
  const t = useTranslations("home.auth.error"); // Assuming translations are in home.auth.error
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const [errorDetails, setErrorDetails] = useState({ title: t('defaultTitle'), message: t('defaultMessage') });

  useEffect(() => {
    let title = t('defaultTitle');
    let message = t('defaultMessage');

    switch (error) {
      // NextAuth default errors (customize messages as needed)
      case "Configuration":
        title = t('configErrorTitle');
        message = t('configErrorMessage');
        break;
      case "AccessDenied":
        title = t('accessDeniedTitle');
        message = t('accessDeniedMessage');
        break;
      case "Verification": // Generic verification error from NextAuth built-in email provider (less likely now)
        title = t('verificationErrorTitle');
        message = t('verificationGenericMessage');
        break;
      case "CredentialsSignin":
         title = t('signInErrorTitle');
         message = t('credentialsSignInMessage');
         break;

      // Custom errors from our flows
       case "VerificationMissingToken":
       case "VerificationInvalidToken":
       case "VerificationExpiredToken":
       case "VerificationUserNotFound":
       case "VerificationFailed":
         title = t('verificationErrorTitle');
         message = t(`verificationError_${error}`); // Use specific translation keys like verificationError_VerificationInvalidToken
         break;
       case "EmailNotVerified": // Error thrown in authorize
         title = t('emailNotVerifiedTitle');
         message = t('emailNotVerifiedMessage');
         break;
       case "Invalid login code": // Error thrown in authorize
       case "Login code expired": // Error thrown in authorize
         title = t('signInErrorTitle');
         message = t('invalidOrExpiredCodeMessage');
         break;

      // Add more specific cases as needed

      default:
        // Keep default messages if error code is unknown
        console.warn("Unknown auth error code:", error);
        break;
    }
    setErrorDetails({ title, message });
  }, [error, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-red-500">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-red-800">{errorDetails.title}</CardTitle>
          <CardDescription className="mt-2 text-red-600">{errorDetails.message}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Optionally display the raw error code for debugging in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <p className="mt-4 text-center text-xs text-gray-500">Error code: {error}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/auth/login">{t('backToLogin')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
