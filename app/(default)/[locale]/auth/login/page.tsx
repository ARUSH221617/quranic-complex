"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type LoginMethod = "password" | "emailCode";

export default function LoginPage() {
  const t = useTranslations("home.auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [isCodeRequested, setIsCodeRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [apiMessage, setApiMessage] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [verifiedMessage, setVerifiedMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for verification success message
    if (searchParams?.get("verified") === "true") {
      setVerifiedMessage(t("emailVerifiedSuccess")); // Need translation key: emailVerifiedSuccess
      // Optionally remove the query param after showing the message
      // router.replace('/auth/login', { scroll: false }); // Be careful with infinite loops if state updates trigger effect
    }
    // Check for NextAuth errors passed in query params
    const error = searchParams?.get("error");
    if (error) {
      handleAuthError(error);
      // Optionally remove the error param
      // router.replace('/auth/login', { scroll: false });
    }
  }, [searchParams, t, router]);

  const handleAuthError = (error: string) => {
    let title = t("loginError");
    let description = t("unexpectedError");

    switch (error) {
      case "CredentialsSignin":
      case "Invalid login code": // Match error thrown in authorize
      case "Login code expired": // Match error thrown in authorize
        title = t("invalidCredentials");
        description = t("pleaseTryAgain");
        break;
      case "Email not verified": // Match error thrown in authorize
        title = t("emailNotVerifiedTitle");
        description = t("emailNotVerifiedDesc");
        break;
      // Add cases for verification errors if needed
      case "VerificationInvalidToken":
        title = t("verificationErrorTitle");
        description = t("verificationInvalidTokenDesc");
        break;
      case "VerificationExpiredToken":
        title = t("verificationErrorTitle");
        description = t("verificationExpiredTokenDesc");
        break;
      // ... other specific errors
    }
    setApiMessage({ type: "error", text: `${title}: ${description}` });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiMessage(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);
    if (result?.error) {
      handleAuthError(result.error);
    } else if (result?.ok) {
      toast({ title: t("loginSuccess"), description: t("redirecting") });
      router.push(`/dashboard`); // Redirect to dashboard or intended page
    } else {
      setApiMessage({ type: "error", text: t("unexpectedError") });
    }
  };

  const handleRequestCode = async () => {
    if (!email) {
      setApiMessage({ type: "error", text: t("emailRequired") }); // Need translation key: emailRequired
      return;
    }
    setIsRequestingCode(true);
    setApiMessage(null);

    try {
      const response = await fetch("/api/auth/request-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok) {
        setApiMessage({
          type: "error",
          text: result.message || t("requestCodeFailed"),
        }); // Need translation key: requestCodeFailed
      } else {
        setApiMessage({
          type: "success",
          text: result.message || t("codeSentSuccess"),
        }); // Need translation key: codeSentSuccess
        setIsCodeRequested(true); // Show the code input field
      }
    } catch (error) {
      console.error("Request code error:", error);
      setApiMessage({ type: "error", text: t("networkError") });
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiMessage(null);

    const result = await signIn("email-code", {
      redirect: false,
      email,
      loginCode,
    });

    setIsLoading(false);
    if (result?.error) {
      handleAuthError(result.error);
    } else if (result?.ok) {
      toast({ title: t("loginSuccess"), description: t("redirecting") });
      router.push(`/dashboard`); // Redirect to dashboard or intended page
    } else {
      setApiMessage({ type: "error", text: t("unexpectedError") });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Verification Success Message */}
          {verifiedMessage && (
            <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
              <Terminal className="h-4 w-4" />
              <AlertTitle>{t("verificationSuccessTitle")}</AlertTitle>
              <AlertDescription>{verifiedMessage}</AlertDescription>
            </Alert>
          )}
          {/* API Message Area */}
          {apiMessage && (
            <Alert
              variant={apiMessage.type === "error" ? "destructive" : "default"}
              className={`mb-4 ${
                apiMessage.type === "success"
                  ? "border-green-500 bg-green-50 text-green-800"
                  : ""
              }`}
            >
              <Terminal className="h-4 w-4" />
              <AlertTitle>
                {apiMessage.type === "error" ? t("errorTitle") : t("infoTitle")}
              </AlertTitle>
              <AlertDescription>{apiMessage.text}</AlertDescription>
            </Alert>
          )}

          <Tabs
            value={loginMethod}
            onValueChange={(value) => setLoginMethod(value as LoginMethod)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">{t("passwordMethod")}</TabsTrigger>{" "}
              {/* Need translation */}
              <TabsTrigger value="emailCode">
                {t("emailCodeMethod")}
              </TabsTrigger>{" "}
              {/* Need translation */}
            </TabsList>

            {/* Password Login Form */}
            <TabsContent value="password">
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="email-pass">{t("emailLabel")}</Label>
                  <Input
                    id="email-pass"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t("passwordLabel")}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("signingInProgress") : t("signInWithPassword")}{" "}
                  {/* Need translation */}
                </Button>
              </form>
            </TabsContent>

            {/* Email Code Login Form */}
            <TabsContent value="emailCode">
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="email-code">{t("emailLabel")}</Label>
                  <Input
                    id="email-code"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isCodeRequested} // Disable email input after requesting code
                    className="mt-1"
                  />
                </div>

                {!isCodeRequested ? (
                  <Button
                    onClick={handleRequestCode}
                    className="w-full"
                    disabled={isRequestingCode || !email}
                  >
                    {isRequestingCode ? t("sendingCode") : t("sendLoginCode")}{" "}
                    {/* Need translations */}
                  </Button>
                ) : (
                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="loginCode">{t("loginCodeLabel")}</Label>{" "}
                      {/* Need translation */}
                      <Input
                        id="loginCode"
                        name="loginCode"
                        type="text" // Or "number" - ensure it handles 6 digits
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                        value={loginCode}
                        onChange={(e) => setLoginCode(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || loginCode.length !== 6}
                    >
                      {isLoading ? t("signingInProgress") : t("signInWithCode")}{" "}
                      {/* Need translation */}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setIsCodeRequested(false);
                        setApiMessage(null);
                        setLoginCode("");
                      }}
                      className="w-full text-sm"
                    >
                      {t("useDifferentEmail")} {/* Need translation */}
                    </Button>
                  </form>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            {t("noAccount")}{" "}
            <Link
              href={`/auth/register`}
              className="font-medium text-primary hover:underline"
            >
              {t("register")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
