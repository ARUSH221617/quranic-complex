"use client";

import React from "react";
import GlobalLoading from "@/components/ui/GlobalLoading";

interface DefaultGlobalLoadingProps {
  message?: string;
}

const DefaultGlobalLoading: React.FC<DefaultGlobalLoadingProps> = ({
  message,
}) => {
  return (
    <>
      <p>{message}</p>
      <GlobalLoading
        className="bg-white text-gray-700"
        namespace="DefaultLoading"
      />
    </>
  );
};

export default DefaultGlobalLoading;
