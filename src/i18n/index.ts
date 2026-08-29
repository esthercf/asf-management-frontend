
import { createI18n } from 'vue-i18n'

import en from './locales/en'
import ca from './locales/ca'
import de from './locales/de'
import es from './locales/es'
import fr from './locales/fr'
import it from './locales/it'
import ja from './locales/ja'
import ko from './locales/ko'
import pt from './locales/pt'
import ru from './locales/ru'
import zh from './locales/zh'

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'ca', label: 'Català' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
] as const

export type LocaleCode = typeof SUPPORTED_LOCALES[number]['code']

/**
 * Picks the best matching supported locale from the browser's language
 * preferences. Checks navigator.languages (the full ordered preference
 * list, not just navigator.language) so a browser set to e.g.
 * ["ca-ES", "es-ES", "en-US"] correctly picks Catalan over Spanish.
 * Matches on the base language code only (ignoring region — "ca-ES"
 * matches our "ca"), since none of our locale files are region-specific.
 */
function detectInitialLocale(): LocaleCode {
  const supportedCodes = SUPPORTED_LOCALES.map(l => l.code)
  const browserLangs = navigator.languages ?? [navigator.language]

  for (const lang of browserLangs) {
    const baseCode = lang.split('-')[0].toLowerCase()
    if (supportedCodes.includes(baseCode as LocaleCode)) {
      return baseCode as LocaleCode
    }
  }

  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, ca, es, fr, it, de, pt, ru, zh, ja, ko }
})