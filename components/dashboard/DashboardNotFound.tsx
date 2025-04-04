"use client";

import React from "react";
import NotFound from "@/components/ui/NotFound";

const DashboardNotFound: React.FC = () => {
  return (
    <NotFound
      linkHref="/dashboard"
      className="bg-blue-50 text-blue-900"
      namespace="DashboardNotFound"
    />
  );
};

export default DashboardNotFound;
