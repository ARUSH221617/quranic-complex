"use client";

import React from "react";
import GlobalLoading from "@/components/ui/GlobalLoading";

interface DashboardGlobalLoadingProps {
  message?: string;
}

const DashboardGlobalLoading: React.FC<DashboardGlobalLoadingProps> = ({
  message,
}) => {
  return (
    <>
      <p>{message}</p>
      <GlobalLoading
        className="bg-gray-100 text-gray-900"
        namespace="DashboardLoading"
      />
    </>
  );
};

export default DashboardGlobalLoading;
