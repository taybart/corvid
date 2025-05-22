/***************
 *    Style    *
 **************/

export function cssVar(name: string) {
  const style = window.getComputedStyle(document.body)
  return style.getPropertyValue(name)
}

/**
 * Check if the current theme is dark
 */
export function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Listen for changes in the dark mode preference
 * @param cb - Callback function when theme changes
 */
export function onDarkMode(cb: (isDark: boolean) => void) {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (ev) => {
      cb(ev.matches)
    })
}

/**
 * Switch between light and dark theme
 * @param theme - 'light' or 'dark'
 */
export function switchTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Listen for changes in the dark mode preference
 */
export function handleThemeSwitch() {
  switchTheme(isDarkMode() ? 'dark' : 'light')
  onDarkMode((dark) => {
    switchTheme(dark ? 'dark' : 'light')
  })
}

/**
 * Calculate a color gradient
 * @param start - The starting color
 * @param end - The ending color
 * @param value - The value to interpolate between the start and end colors 0 <= value <= 100
 * @return rgb string
 */
export type color = {
  red: number
  green: number
  blue: number
}
export function gradient(start: color, end: color, value: number): string {
  // Ensure value is between 0 and 100
  value = Math.max(0, Math.min(100, value))
  // Calculate the color components based on the value
  const red = Math.round(start.red + ((end.red - start.red) * value) / 100)
  const green = Math.round(
    start.green + ((end.green - start.green) * value) / 100,
  )
  const blue = Math.round(start.blue + ((end.blue - start.blue) * value) / 100)
  return `rgb(${red}, ${green}, ${blue})`
}
