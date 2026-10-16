/** Constants for the site's locale/language switcher. */

/**
 * Default inert locale-switch hook.
 *
 * The pill exposes this hook only; the real i18n routing arrives with the
 * i18n spec. Rendering the menu item with no handler wired is safe because
 * this default does nothing.
 */
export function stubLocaleChange(locale: string): void {
  void locale;
}

/**
 * Languages the clinic's i18n slice will support (spec renegotiation 4).
 * Native names, keyboard-order stable: English, Arabic, Russian.
 */
export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
] as const;
