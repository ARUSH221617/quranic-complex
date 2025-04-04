'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from './button'; // Assuming you have a Button component

interface NotFoundProps {
  linkHref?: string;
  className?: string;
  namespace?: string; // Add namespace prop
}

const NotFound: React.FC<NotFoundProps> = ({
  linkHref = '/',
  className = '',
  namespace = 'NotFound', // Default namespace
}) => {
  const t = useTranslations(namespace);
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 text-center ${className}`}
    >
      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-lg mb-8">{t('message')}</p>
      <Button asChild>
        <Link href={linkHref}>{t('buttonText')}</Link>
      </Button>
    </div>
  );
};

export default NotFound;
