"use client"; // Error components must be Client Components

import DefaultGlobalError from "@/components/layout/DefaultGlobalError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DefaultGlobalError error={error} reset={reset} />;
}
