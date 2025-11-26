import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Define the locales here or import them from a config file
const locales = ['en', 'ar'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});