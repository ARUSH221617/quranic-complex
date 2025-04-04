"use client";

import React from "react";
import GlobalError from "@/components/ui/GlobalError";

interface DashboardGlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const DashboardGlobalError: React.FC<DashboardGlobalErrorProps> = ({
  error,
  reset,
}) => {
  return (
    <GlobalError
      error={error}
      reset={reset}
      className="bg-blue-50 text-blue-900"
      namespace="DashboardError"
    />
  );
};

export default DashboardGlobalError;
