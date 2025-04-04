"use client";

import React from "react";
import GlobalError from "@/components/ui/GlobalError";

interface DefaultGlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const DefaultGlobalError: React.FC<DefaultGlobalErrorProps> = ({
  error,
  reset,
}) => {
  return (
    <GlobalError
      error={error}
      reset={reset}
      className="bg-gray-50 text-gray-800"
      namespace="DefaultError"
    />
  );
};

export default DefaultGlobalError;
