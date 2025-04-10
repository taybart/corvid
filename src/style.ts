/***************
 *    Style    *
 **************/
export function switchTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function cssVar(name: string) {
  const style = window.getComputedStyle(document.body)
  return style.getPropertyValue(name)
}

// export function getTheme() {
//   const style = window.getComputedStyle(document.body)
//   return {
//     fgColor: style.getPropertyValue('--fg-color'),
//     bgColor: style.getPropertyValue('--bg-color'),
//     goodColor: style.getPropertyValue('--good-color'),
//     badColor: style.getPropertyValue('--bad-color'),
//   }
// }

export function isDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
export function onDarkMode(cb: (dark: boolean) => void) {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (ev) => {
      cb(ev.matches)
    })
}

export type Color = { red: number; green: number; blue: number; alpha: number }
export function gradient(start: Color, end: Color, value: number) {
  value = Math.max(0, Math.min(100, value))
  const red = Math.round(start.red + ((end.red - start.red) * value) / 100)
  const green = Math.round(
    start.green + ((end.green - start.green) * value) / 100,
  )
  const blue = Math.round(start.blue + ((end.blue - start.blue) * value) / 100)
  const alpha = Math.round(
    start.alpha + ((end.alpha - start.alpha) * value) / 100,
  )
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
