import { test, expect, describe, vi } from 'vitest'
import { fireEvent } from '@testing-library/dom'
import * as dom from './dom'

describe('dom', () => {
  test('create element', () => {
    const div = new dom.el({
      tag: 'div',
      id: 'test',
      content: 'hopefully this passes!',
      parent: window.document.body,
      class: 'cool-div',
      style: {
        color: 'red',
      },
    })
    expect(div.value()).toBe('hopefully this passes!')

    // check it was successfully created
    const test_div = window.document.getElementById('test')
    expect(test_div).toBeTruthy()
    expect(test_div?.id).toBe('test')
    expect(test_div?.innerText).toBe('hopefully this passes!')
    expect(test_div?.tagName).toBe('DIV')
    expect(test_div?.classList).toContain('cool-div')
    expect(test_div?.style.color).toBe('red')
  })

  test('query element', () => {
    const id_div = new dom.el('#test')
    expect(id_div.value()).toBe('hopefully this passes!')
    const class_div = new dom.el('.cool-div')
    expect(class_div.value()).toBe('hopefully this passes!')
  })

  test('element event', () => {
    const div = new dom.el('#test')
    const cb = vi.fn()
    div.on('click', cb)
    fireEvent.click(div.el!)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('fires callback onKey', () => {
    const cb = vi.fn(({ ctrl }: { ctrl: boolean }) => {
      expect(ctrl).toBeTruthy()
    })
    dom.onKey('a', cb)
    fireEvent.keyDown(window, {
      key: 'a',
      ctrlKey: true,
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('component', () => {
  test('register defines the tag and is idempotent', () => {
    class Widget extends dom.component {
      static tag = 'x-widget'
    }
    Widget.register()
    expect(customElements.get('x-widget')).toBe(Widget)
    // a second call is a no-op, not a NotSupportedError
    expect(() => Widget.register()).not.toThrow()
    expect(new Widget() instanceof dom.component).toBe(true)
  })

  test('register throws without a usable tag', () => {
    class NoTag extends dom.component {}
    expect(() => NoTag.register()).toThrow(/nothing to register as/)
    class BadTag extends dom.component {
      static tag = 'widget'
    }
    expect(() => BadTag.register()).toThrow(/needs a hyphen/)
    // an explicit tag overrides the static
    expect(() => NoTag.register('x-explicit')).not.toThrow()
  })

  test('a different class on a taken name throws', () => {
    class First extends dom.component {
      static tag = 'x-taken'
    }
    class Second extends dom.component {
      static tag = 'x-taken'
    }
    First.register()
    expect(() => Second.register()).toThrow(/already registered/)
  })

  test('static styles are injected scoped to the tag', () => {
    class Styled extends dom.component {
      static tag = 'x-styled'
      static styles = {
        marginTop: '33vh',
        input: { border: 'none' },
        '&[data-open]': { marginTop: '5vh' },
      }
    }
    Styled.register()
    const css = document.adoptedStyleSheets
      .flatMap((sheet) => Array.from(sheet.cssRules).map((r) => r.cssText))
      .join('\n')
    expect(css).toContain('x-styled')
    expect(css).toContain('x-styled input')
    expect(css).toContain('x-styled[data-open]')
  })

  test('occupies only its own small surface', () => {
    // the guard against re-crowding: everything else on a component is native
    // dom, so nothing here can shadow the platform or a subclass's own methods
    expect(Object.getOwnPropertyNames(dom.component.prototype).sort()).toEqual([
      'attributeChangedCallback',
      'connectedCallback',
      'constructor',
      'disconnectedCallback',
      'mount',
      'onAttr',
      'unmount',
    ])
  })

  test('leaves the native dom alone', () => {
    class Native extends dom.component {
      static tag = 'x-native'
    }
    Native.register()
    const node = new Native()
    document.body.appendChild(node)
    // style is the native accessor, not a method
    node.style.color = 'red'
    expect(node.style.color).toBe('red')
    // append takes a string instead of recursing into itself
    expect(() => node.append('text')).not.toThrow()
    // appendChild returns the child, per spec
    const child = document.createElement('i')
    expect(node.appendChild(child)).toBe(child)
    // el's helpers are still one explicit step away
    new dom.el(node).style({ marginTop: '5vh' })
    expect(node.style.marginTop).toBe('5vh')
  })

  test('mount runs once across re-insertion, unmount on disconnect', () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    class Life extends dom.component {
      static tag = 'x-life'
      mount() {
        mounted()
        this.append(dom.create({ tag: 'span', content: 'once' }))
      }
      unmount() {
        unmounted()
      }
    }
    Life.register()
    const node = new Life()
    document.body.appendChild(node)
    node.remove()
    document.body.appendChild(node)
    expect(mounted).toHaveBeenCalledTimes(1)
    expect(unmounted).toHaveBeenCalledTimes(1)
    // the subtree was built once, not once per insertion
    expect(node.querySelectorAll('span').length).toBe(1)
  })
})

describe('create', () => {
  test('returns the node, not a wrapper', () => {
    const node = dom.create({ tag: 'p', content: 'hi' })
    expect(node).toBeInstanceOf(HTMLElement)
    expect(node).not.toBeInstanceOf(dom.el)
    expect(node.tagName).toBe('P')
    expect(node.innerHTML).toBe('hi')
  })

  test('applies the same options as el', () => {
    const parent = dom.create({ tag: 'div', parent: document.body })
    const node = dom.create({
      tag: 'span',
      id: 'made',
      class: ['a', 'b'],
      attrs: { 'data-x': '1' },
      style: { color: 'red' },
      content: 'x',
      parent,
    })
    expect(node.id).toBe('made')
    expect(node.className).toBe('a b')
    expect(node.getAttribute('data-x')).toBe('1')
    expect(node.style.color).toBe('red')
    expect(node.parentElement).toBe(parent)
  })

  test('a custom element comes back with its own methods', () => {
    class Greeter extends dom.component {
      static tag = 'x-greeter'
      greeting = 'hi'
      greet() {
        return this.greeting
      }
    }
    Greeter.register()
    // the point of create(): no `.el` hop to reach the component's own api
    const node = dom.create<Greeter>({ tag: 'x-greeter', parent: document.body })
    expect(node.greet()).toBe('hi')
    expect(node.isConnected).toBe(true)
  })

  test('throws rather than handing back null', () => {
    expect(() => dom.create({ query: '#nope' })).toThrow()
  })
})

describe('component attributes', () => {
  test('onAttr never fires before mount, and nothing set early is lost', () => {
    const order: string[] = []
    class Watched extends dom.component {
      static tag = 'x-watched'
      static observedAttributes = ['label', 'count']
      mount() {
        order.push('mount')
      }
      onAttr(name: string, value: string | null, prev: string | null) {
        order.push(`${name}=${value} (was ${prev})`)
      }
    }
    Watched.register()

    const node = new Watched()
    // the platform reports these before connectedCallback
    node.setAttribute('label', 'a')
    node.setAttribute('count', '1')
    expect(order).toEqual([])

    document.body.appendChild(node)
    // mount first, then the queued changes in the order they happened
    expect(order).toEqual(['mount', 'label=a (was null)', 'count=1 (was null)'])

    // once mounted, changes are delivered straight through
    node.setAttribute('label', 'b')
    expect(order.at(-1)).toBe('label=b (was a)')
    node.removeAttribute('label')
    expect(order.at(-1)).toBe('label=null (was b)')
  })

  test('a no-op write does not fire', () => {
    const seen: (string | null)[] = []
    class Same extends dom.component {
      static tag = 'x-same'
      static observedAttributes = ['v']
      onAttr(_name: string, value: string | null) {
        seen.push(value)
      }
    }
    Same.register()
    const node = new Same()
    document.body.appendChild(node)
    node.setAttribute('v', '1')
    node.setAttribute('v', '1')
    expect(seen).toEqual(['1'])
  })

  test('an object cannot ride an attribute', () => {
    // why structured data wants a property instead
    const node = dom.create({ tag: 'div', attrs: { media: { title: 'Heat' } } })
    expect(node.getAttribute('media')).toBe('[object Object]')
  })
})
