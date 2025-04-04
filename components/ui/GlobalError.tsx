"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { Button } from "./button"; // Assuming you have a Button component

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  className?: string;
  namespace?: string; // Add namespace prop
}

const GlobalError: React.FC<GlobalErrorProps> = ({
  error,
  reset,
  className = "",
  namespace = 'Error', // Default namespace
}) => {
  const t = useTranslations(namespace);

  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 text-center ${className}`}
    >
      <h2 className="text-2xl font-semibold mb-4">{t('title')}</h2>
      <p className="mb-6">{t('message')}</p>
      {/* Optionally display error details in development */}
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4 overflow-auto max-w-full">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      )}
      <Button onClick={reset}>{t('buttonText')}</Button>
    </div>
  );
};

export default GlobalError;
