import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type RegionNames = { of(code: string): string | undefined }
type RegionNamesConstructor = new (locales: string[], options: { type: 'region' }) => RegionNames

/**
 * Country names in the language of the screen, taken from the browser's own data, so there is no
 * list of names to maintain (and it follows the language switch). If the browser cannot provide
 * a name, the plain code is shown.
 */
export function useCountryNames() {
  const { locale } = useI18n()

  const names = computed<RegionNames | undefined>(() => {
    const Ctor = (Intl as unknown as { DisplayNames?: RegionNamesConstructor }).DisplayNames
    try {
      return Ctor ? new Ctor([locale.value], { type: 'region' }) : undefined
    } catch {
      return undefined
    }
  })

  function countryName(code: string): string {
    try {
      return names.value?.of(code) ?? code
    } catch {
      return code // not a valid region code
    }
  }

  /** "Andorra (AD)": the code stays next to the name because the Excel import asks for codes. */
  function countryLabel(code: string): string {
    const name = countryName(code)
    return name === code ? code : `${name} (${code})`
  }

  /** Options sorted by name, in the order of the current language. */
  function sortedCountryOptions(codes: readonly string[]): { code: string; label: string }[] {
    return codes
      .map((code) => ({ code, label: countryLabel(code) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale.value))
  }

  return { countryName, countryLabel, sortedCountryOptions }
}