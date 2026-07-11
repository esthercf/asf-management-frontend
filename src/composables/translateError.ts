
import { useI18n } from 'vue-i18n';

export function translateError(message: string | undefined): string {
  const { t } = useI18n();
  if (!message) return '';

  // Only treat as a key if it matches the xxx.xxx pattern
  const isKey = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+/.test(message);

  if (isKey) {
    const key = `common.validation.${message}`;
    const translated = t(key);
    return translated === key ? message : translated;
  }

  // Otherwise assume it's already a literal string
  return message;
}