/**
 * Claude Code's `language` setting from the merged settings, undefined when unset or blank.
 *
 * @param settings what `$.settings.read()` resolved
 */
export function userLanguageOf(settings: Readonly<Record<string, unknown>>): string | undefined {
  const { language } = settings

  return typeof language === 'string' && language.trim() !== '' ? language.trim() : undefined
}
