"use client";

import React from "react";
import { useTranslations } from 'next-intl';

interface GlobalLoadingProps {
  className?: string;
  namespace?: string; // Add namespace prop
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  className = "",
  namespace = 'Loading', // Default namespace
}) => {
  const t = useTranslations(namespace);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 text-center ${className}`}
    >
      {/* You can replace this with a spinner or any other loading indicator */}
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-lg font-medium">{t('message')}</p>
    </div>
  );
};

export default GlobalLoading;
