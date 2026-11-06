const THEME_STORAGE_KEY = 'gigahertz-theme'

export function getInitialDarkTheme(): boolean {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) !== 'light'
  } catch {
    return true
  }
}

export function saveThemePreference(isDark: boolean): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
  } catch {
    // Keep the current in-memory theme if browser storage is unavailable.
  }
}
