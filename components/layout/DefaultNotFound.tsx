'use client';

import React from 'react';
import NotFound from '@/components/ui/NotFound';

const DefaultNotFound: React.FC = () => {
  return (
    <NotFound
      linkHref="/"
      className="bg-gray-50 text-gray-800"
      namespace="DefaultNotFound"
    />
  );
};

export default DefaultNotFound;
