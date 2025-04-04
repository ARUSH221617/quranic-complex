"use client"; // Error components must be Client Components

import DashboardGlobalError from "@/components/dashboard/DashboardGlobalError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardGlobalError error={error} reset={reset} />;
}
