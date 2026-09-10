import { test, expect, describe, beforeEach } from 'vitest'
import * as style from './style'

describe('style.css', () => {
  test('flat block', () => {
    expect(style.css('#q', { border: 'none', fontSize: '1rem' })).toBe(
      '#q {\n  border: none;\n  font-size: 1rem;\n}',
    )
  })

  test('nests descendants and &', () => {
    const css = style.css('x-search-form', {
      flexGrow: '0',
      input: {
        border: 'none',
        '&:focus': { borderBottomColor: 'var(--ring)' },
      },
    })
    expect(css).toBe(
      [
        'x-search-form {\n  flex-grow: 0;\n}',
        'x-search-form input {\n  border: none;\n}',
        'x-search-form input:focus {\n  border-bottom-color: var(--ring);\n}',
      ].join('\n'),
    )
  })

  test('& in any position', () => {
    expect(style.css('x-f', { '.dark &': { color: 'white' } })).toBe(
      '.dark x-f {\n  color: white;\n}',
    )
  })

  test('selector lists cross-multiply, :is() stays intact', () => {
    expect(style.css('a, b', { ':is(p, span)': { color: 'red' } })).toBe(
      'a :is(p, span), b :is(p, span) {\n  color: red;\n}',
    )
    expect(style.css('a', { '&:hover, &:focus': { color: 'red' } })).toBe(
      'a:hover, a:focus {\n  color: red;\n}',
    )
  })

  test('at-rules wrap the parent selector', () => {
    expect(
      style.css('x-f', {
        marginTop: '33vh',
        '@media (max-width: 40rem)': { marginTop: '1rem' },
      }),
    ).toBe(
      'x-f {\n  margin-top: 33vh;\n}\n@media (max-width: 40rem) {\n  x-f {\n    margin-top: 1rem;\n  }\n}',
    )
  })

  test('keyframe steps are literal, not descendants', () => {
    expect(
      style.css('x-f', {
        '@keyframes spin': { from: { rotate: '0deg' }, to: { rotate: '1turn' } },
      }),
    ).toBe(
      '@keyframes spin {\n  from {\n    rotate: 0deg;\n  }\n  to {\n    rotate: 1turn;\n  }\n}',
    )
  })

  test('numeric values', () => {
    expect(style.css('x-f', { padding: 0, zIndex: 2 })).toBe(
      'x-f {\n  padding: 0;\n  z-index: 2;\n}',
    )
  })
})

describe('style.inject', () => {
  beforeEach(() => {
    document.adoptedStyleSheets = []
    delete (document as any).__corvidSheets
    document.head.innerHTML = ''
  })

  test('adopts one sheet and returns the css', () => {
    const css = style.inject('x-f', { color: 'red' })
    expect(css).toBe('x-f {\n  color: red;\n}')
    expect(document.adoptedStyleSheets.length).toBe(1)
    expect(document.head.querySelectorAll('style').length).toBe(0)
  })

  test('re-injecting replaces in place', () => {
    style.inject('x-f', { color: 'red' })
    const sheet = document.adoptedStyleSheets[0]
    style.inject('x-f', { color: 'blue' })
    expect(document.adoptedStyleSheets.length).toBe(1)
    expect(document.adoptedStyleSheets[0]).toBe(sheet)
    expect(sheet.cssRules[0].cssText).toContain('blue')
  })

  test('separate keys are separate sheets', () => {
    style.inject('x-f', { color: 'red' })
    style.inject('x-g', { color: 'blue' })
    expect(document.adoptedStyleSheets.length).toBe(2)
  })

  test('key overrides the selector for dedupe', () => {
    style.inject('x-f a', { color: 'red' }, { key: 'x-f' })
    style.inject('x-f b', { color: 'blue' }, { key: 'x-f' })
    expect(document.adoptedStyleSheets.length).toBe(1)
    expect(document.adoptedStyleSheets[0].cssRules[0].cssText).toContain('x-f b')
  })

  test('eject removes it', () => {
    style.inject('x-f', { color: 'red' })
    style.eject('x-f')
    expect(document.adoptedStyleSheets.length).toBe(0)
    // ejecting an unknown key is a no-op
    style.eject('nope')
    expect(document.adoptedStyleSheets.length).toBe(0)
  })
})

describe('shadow sheets', () => {
  test('a compound on :host is folded into its functional form', () => {
    // `:host[open]` and `:host:hover` are silently inert in a real browser;
    // only `:host(...)` matches the host
    const out = style.css(':host', {
      color: 'red',
      '&:hover': { color: 'blue' },
      '&[aria-expanded="true"]': { color: 'green' },
      '&.picked': { color: 'teal' },
    })
    expect(out).toContain(':host {')
    expect(out).toContain(':host(:hover)')
    expect(out).toContain(':host([aria-expanded="true"])')
    expect(out).toContain(':host(.picked)')
    expect(out).not.toMatch(/:host[.:[][^(]/)
  })

  test('the compound stops at a combinator', () => {
    const out = style.css(':host', {
      '&[aria-expanded="true"]': { '> .detail': { display: 'flex' } },
    })
    expect(out).toContain(':host([aria-expanded="true"]) > .detail')
  })

  test('a nested & merges into an argument already there', () => {
    // `:host(.a):hover` is as dead as `:host:hover`; it all has to go inside
    const out = style.css(':host', {
      '&.destructive': {
        color: 'red',
        '&:hover': { color: 'blue' },
      },
    })
    expect(out).toContain(':host(.destructive)')
    expect(out).toContain(':host(.destructive:hover)')
    expect(out).not.toContain(':host(.destructive):hover')
  })

  test('a quoted paren does not end the argument early', () => {
    const out = style.css(':host', {
      '&[data-x=")"]': { '&:hover': { color: 'red' } },
    })
    expect(out).toContain(':host([data-x=")"]:hover)')
  })

  test('a pseudo-element stays outside the parens', () => {
    // `:host(::before)` is invalid; `:host::before` is how it is written
    const out = style.css(':host', { '&::before': { content: '""' } })
    expect(out).toContain(':host::before')
  })

  test('descendants need no host prefix of their own', () => {
    const out = style.css(':host', { '.head': { display: 'flex' } })
    expect(out).toContain(':host .head')
  })

  test('a tag root is left alone', () => {
    const out = style.css('x-thing', { '&:hover': { color: 'red' } })
    expect(out).toContain('x-thing:hover')
    expect(out).not.toContain(':host')
  })

  test('one sheet per key, replaced in place on recompile', () => {
    const first = style.shadowSheet('shadow:x-s', { color: 'red' })
    const again = style.shadowSheet('shadow:x-s', { color: 'blue' })
    expect(again).toBe(first)
    expect((again as CSSStyleSheet).cssRules[0].cssText).toContain('blue')
  })
})
