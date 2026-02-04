export const locales = ['en', 'tw'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  tw: 'Twi',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  tw: '🇬🇭',
}
