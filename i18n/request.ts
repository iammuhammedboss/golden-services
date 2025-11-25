// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(() => ({
  // Supported languages
  locales: ['en', 'ar'],
  // Default language
  defaultLocale: 'en',
}));
