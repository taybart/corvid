/***************
 *    Style    *
 **************/

import { toKebab } from './strings'

export function cssVar(name: string) {
  const style = window.getComputedStyle(document.body)
  return style.getPropertyValue(name)
}

export function render(style: Object): string {
  let s = ''
  Object.entries(style).forEach(([k, v]) => (s += `${toKebab(k)}:${v};`))
  return s
}

/**
 * A block of css declarations. A value that is itself an object is a nested
 * rule: the key is a selector (`&:focus`, `input`) or an at-rule (`@media ...`)
 * rather than a property.
 */
export type declarations = {
  [key: string]: string | number | declarations
}

/**
 * Split a selector list on top-level commas only — `:is(a, b)` is one
 * selector, not two.
 */
function splitSelectors(selector: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let current = ''
  for (const ch of selector) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '(' || ch === '[') {
      depth++
    } else if (ch === ')' || ch === ']') {
      depth--
    } else if (ch === ',' && depth === 0) {
      if (current.trim()) out.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) out.push(current.trim())
  return out
}

/**
 * Resolve a nested selector against its parents. `&` splices onto the parent
 * (`&:focus` -> `x-form:focus`, `.dark &` -> `.dark x-form`), anything else
 * nests as a descendant (`input` -> `x-form input`).
 */
function resolve(parents: string[], selector: string): string[] {
  const out: string[] = []
  for (const parent of parents) {
    for (const part of splitSelectors(selector)) {
      out.push(part.includes('&') ? part.replaceAll('&', parent) : `${parent} ${part}`)
    }
  }
  return out
}

/**
 * Flatten a (possibly nested) declaration block into css rules. Kebabs keys,
 * so backgroundColor -> background-color.
 */
function compile(
  parents: string[],
  decls: declarations,
  indent = '',
): string[] {
  const blocks: string[] = []
  const props: string[] = []
  const nested: [string, declarations][] = []

  for (const [k, v] of Object.entries(decls)) {
    if (v !== null && typeof v === 'object') {
      nested.push([k, v])
    } else {
      props.push(`${indent}  ${toKebab(k)}: ${v};`)
    }
  }
  if (props.length) {
    blocks.push(
      `${indent}${parents.join(', ')} {\n${props.join('\n')}\n${indent}}`,
    )
  }
  for (const [selector, block] of nested) {
    // at-rules wrap their contents, keeping the same parent selectors —
    // except @keyframes, whose keys (from/to/50%) are literal steps
    if (selector.startsWith('@')) {
      const inner = selector.startsWith('@keyframes')
        ? Object.entries(block).flatMap(([step, d]) =>
            d !== null && typeof d === 'object'
              ? compile([step], d, `${indent}  `)
              : [],
          )
        : compile(parents, block, `${indent}  `)
      if (inner.length) {
        blocks.push(`${indent}${selector} {\n${inner.join('\n')}\n${indent}}`)
      }
      continue
    }
    blocks.push(...compile(resolve(parents, selector), block, indent))
  }
  return blocks
}

/**
 * Render a declaration block to css without touching the document.
 */
export function css(selector: string, style: declarations): string {
  return compile(splitSelectors(selector), style).join('\n')
}

/*** sheets ***/

// The registry lives on the document rather than in module scope so a module
// reload (HMR) reuses the sheets it already installed instead of stacking
// duplicates on top of them.
function registry(): Map<string, CSSStyleSheet | HTMLStyleElement> {
  const doc = document as any
  if (!doc.__corvidSheets) doc.__corvidSheets = new Map()
  return doc.__corvidSheets
}

function adoptable(): boolean {
  return (
    typeof CSSStyleSheet !== 'undefined' &&
    'replaceSync' in CSSStyleSheet.prototype &&
    typeof Document !== 'undefined' &&
    'adoptedStyleSheets' in Document.prototype
  )
}

// Fallback for browsers without constructable stylesheets: a plain <style>,
// tagged so a reload finds it again instead of appending a second one.
function styleTag(key: string): HTMLStyleElement {
  const tagged = Array.from(
    document.head.querySelectorAll('style[data-corvid]'),
  ) as HTMLStyleElement[]
  for (const node of tagged) {
    if (node.dataset.corvid === key) return node
  }
  const node = document.createElement('style')
  node.dataset.corvid = key
  document.head.appendChild(node)
  return node
}

/**
 * Install a stylesheet for `selector`. Nested objects become nested rules, so
 * a component declares its styles in one call:
 *
 *   inject('x-search-form', {
 *     marginTop: '33vh',
 *     input: {
 *       border: 'none',
 *       '&:focus': { borderBottomColor: 'var(--ring)' },
 *     },
 *   })
 *
 * Injecting the same key again replaces that sheet rather than adding to it;
 * `key` defaults to the selector.
 * @return the generated css
 */
export function inject(
  selector: string,
  style: declarations,
  { key = selector }: { key?: string } = {},
): string {
  const rules = css(selector, style)
  const sheets = registry()
  const existing = sheets.get(key)

  if (existing) {
    if ('replaceSync' in existing) {
      existing.replaceSync(rules)
    } else {
      existing.textContent = rules
    }
    return rules
  }
  if (adoptable()) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(rules)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    sheets.set(key, sheet)
    return rules
  }
  const node = styleTag(key)
  node.textContent = rules
  sheets.set(key, node)
  return rules
}

/**
 * Remove a stylesheet installed by `inject`
 * @param key - the key it was injected under (the selector, unless overridden)
 */
export function eject(key: string) {
  const sheets = registry()
  const sheet = sheets.get(key)
  if (!sheet) return
  if ('replaceSync' in sheet) {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== sheet,
    )
  } else {
    sheet.remove()
  }
  sheets.delete(key)
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
