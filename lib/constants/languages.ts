export const languages = [
  { id: 'en', name: 'English', dir: 'ltr' },
  { id: 'ar', name: 'العربية', dir: 'rtl' },
  { id: 'fa', name: 'فارسی', dir: 'rtl' },
] as const;

export type LanguageId = typeof languages[number]['id'];