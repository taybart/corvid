import * as style from './style'
import { logger, logLevel } from './utils'
/****************
 *     DOM      *
 ***************/

/*** window ***/

/**
 * onDomContentLoaded callback
 */
export function ready(cb: () => void) {
  window.addEventListener('DOMContentLoaded', cb)
}

/**
 * onRefocus, called when the window is refocused
 */
let focused = true
export function onFocus(cb: () => void) {
  window.addEventListener('focus', () => {
    cb()
    focused = true
  })
}
export function onBlur(cb: () => void) {
  window.addEventListener('blur', () => {
    focused = false
    cb()
  })
}

export function on(event: string, cb: (ev: Event) => void) {
  document.addEventListener(event, cb)
  return () => {
    document.removeEventListener(event, cb)
  }
}
export function onKey(
  key: string,
  cb: (ev: {
    ctrl: boolean
    alt: boolean
    meta: boolean
    shift: boolean
  }) => void,
  verbose = false,
) {
  const log = new logger(verbose ? logLevel.debug : logLevel.none, 'onKey')
  log.debug(`adding ${key} keydown listener`)
  const handler = (ev: KeyboardEvent) => {
    if (ev.key === key) {
      cb({
        ctrl: ev.ctrlKey,
        alt: ev.altKey,
        meta: ev.metaKey,
        shift: ev.shiftKey,
      })
    }
  }
  window.addEventListener('keydown', handler)
  return () => {
    log.debug(`removing ${key} listener`)
    window.removeEventListener('keydown', handler)
  }
}

export function els(query: string, verbose: boolean = false) {
  return Array.from(document.querySelectorAll(query)).map((n) => {
    return new el(n, verbose)
  })
}

/**
 * Define a custom element. Defining the same name with the same class again is a
 * no-op rather than a `NotSupportedError`, so a double import or an HMR reload
 * does not blow up; a *different* class on a taken name is still an error.
 */
export function registerElement(name: string, ctor: CustomElementConstructor) {
  const existing = customElements.get(name)
  if (existing) {
    if (existing !== ctor) {
      throw new Error(
        `custom element ${name} is already registered by ${existing.name}`,
      )
    }
    return
  }
  customElements.define(name, ctor)
}

/*** element ***/
export type elOpts = {
  element?: HTMLElement
  query?: string
  tag?: string
  content?: any
  class?: string | string[]
  style?: Object
  id?: string
  parent?: string | HTMLElement | el
  attrs?: Object
}
export class el {
  el: HTMLElement | null
  query = ''
  log: logger
  listeners: Record<
    string,
    Array<{
      cb: (ev: Event) => void
      options?: AddEventListenerOptions | boolean
    }>
  > = {}
  constructor(opts: HTMLElement | string | elOpts, verbose: boolean = false) {
    this.log = new logger(verbose ? logLevel.debug : logLevel.none, 'element')

    // only query for element
    if (typeof opts === 'string') {
      this.query = opts
      this.el = document.querySelector(opts)
      return
    }
    if (opts instanceof HTMLElement) {
      this.log.debug(`using existing element: ${opts}`)
      this.el = opts
      return
    }
    // prettier-ignore
    const {
      query, element, tag, class: styleClass, style, id, content, parent, attrs,
    } = opts as elOpts
    if (query) {
      this.log.debug(`using query: ${query}`)
      this.query = query
      this.el = document.querySelector(query)
      if (!this.el) {
        throw new Error(`no element from query: ${query}`)
      }
    } else if (element) {
      this.log.debug(`using existing element: ${element}`)
      this.el = element
    } else if (tag) {
      this.query = tag
      this.log.debug(`creating element: ${tag}`)
      this.el = document.createElement(tag)
    } else {
      throw new Error('no query or tag provided')
    }
    if (this.el) {
      if (id) {
        this.log.debug(`setting id: ${id}`)
        this.el.id = id
      }
      if (styleClass) {
        if (typeof styleClass === 'string') {
          this.el.classList.add(styleClass)
        } else {
          for (const sc of styleClass) {
            this.el.classList.add(sc)
          }
        }
      }
      if (style) {
        this.style(style)
      }
      if (content) {
        this.log.debug(`setting content: ${content}`)
        this.el.innerHTML = content
      }
      if (parent) {
        this.log.debug(`adding to parent`)
        let p: any = parent
        if (typeof parent == 'string') {
          this.log.debug(`parent query: ${parent}`)
          p = document.querySelector(parent)
        }
        p.appendChild(this.el)
      }
    }
    if (attrs) {
      for (const [key, val] of Object.entries(attrs)) {
        this.log.debug(`setting prop: ${key} to ${val}`)
        this.el.setAttribute(key, val)
      }
    }
  }
  static query(query: string, verbose: boolean = false) {
    return new el(query, verbose)
  }

  /*** dom manipulation ***/
  value(update?: string): string | this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (update !== undefined) {
      if ('value' in this.el) {
        this.el.value = update
      }
      if ('src' in this.el) {
        this.el.src = update
      }
      return this
    }
    if ('value' in this.el) {
      return (this.el as { value: string }).value
    }
    if ('innerText' in this.el) {
      return (this.el as { innerText: string }).innerText
    }
    if ('innerHTML' in this.el) {
      return (this.el as { innerHTML: string }).innerHTML
    }
    this.log.warn(
      `element (${this.query}) does not contain value, returning empty string`,
    )
    return ''
  }
  parent(parent: HTMLElement | el): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    parent.appendChild(this.el)
    return this
  }
  append(ch: HTMLElement | el | string): this {
    return this.child(ch)
  }
  appendChild(ch: HTMLElement | el): this {
    return this.child(ch)
  }
  child(ch: HTMLElement | el | string): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (typeof ch === 'string') {
      this.el.append(ch)
    } else if (ch instanceof el) {
      this.el.appendChild(ch!.el!)
    } else {
      this.el.appendChild(ch)
    }
    return this
  }
  prepend(ch: HTMLElement | el | string): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (typeof ch === 'string') {
      this.el.prepend(ch)
    } else if (ch instanceof el) {
      this.el.prepend(ch!.el!)
    } else {
      this.el.prepend(ch)
    }
    return this
  }
  prependChild(ch: HTMLElement | el | string): this {
    return this.prepend(ch)
  }
  empty(): this {
    if (this.el) {
      this.el.innerHTML = ''
    }
    return this
  }
  content(content: any, { text = false }: { text?: boolean } = {}): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (text) {
      this.el.textContent = content
    } else {
      this.el.innerHTML = content
    }
    return this
  }
  html(content: string): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.innerHTML = content
    return this
  }
  src(url: string): this {
    if (this.el && 'src' in this.el) {
      this.el.src = url
    }
    return this
  }
  attrs(attrs: Object): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    for (const [k, v] of Object.entries(attrs)) {
      this.el.setAttribute(k, v)
    }
    return this
  }
  attr(key: string, val: string): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.setAttribute(key, val)
    return this
  }
  removeAttr(key: string): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.removeAttribute(key)
    return this
  }

  /*** Style ***/
  style(update: Object | string, stringify = false): this {
    if (this.el) {
      if (typeof update === 'string') {
        this.el.style = update
      } else if (typeof update === 'object') {
        if (!stringify) {
          for (const [k, v] of Object.entries(update)) {
            // @ts-ignore
            this.el.style[k] = v
          }
          return this
        }
        const s = style.render(update)
        this.log.debug(`set style: ${this.el.style} -> ${s}`)
        this.el.style = s
      }
    }
    return this
  }
  hasClass(className: string) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    return this.el.classList.contains(className)
  }
  addClass(className: string | string[]): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (typeof className === 'string') {
      this.el.classList.add(className)
    } else {
      for (const sc of className) {
        this.el.classList.add(sc)
      }
    }
    return this
  }
  removeClass(className: string | string[]): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (typeof className === 'string') {
      this.el.classList.remove(className)
    } else {
      for (const sc of className) {
        this.el.classList.remove(sc)
      }
    }
    return this
  }

  /*** Events ***/
  on(
    event: string,
    cb: (ev: Event) => void,
    options?: AddEventListenerOptions | boolean,
  ): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push({ cb, options })
    this.el.addEventListener(event, cb, options)
    return this
  }
  listen(
    event: string,
    cb: (ev: Event) => void,
    options?: AddEventListenerOptions | boolean,
  ): this {
    return this.on(event, cb, options)
  }
  removeListeners(event: string): this {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (!this.listeners[event]) {
      return this
    }
    // pass options back so the `capture` flag matches the registration
    for (const { cb, options } of this.listeners[event]) {
      this.el.removeEventListener(event, cb, options)
    }
    this.listeners[event] = []
    return this
  }
}

/**
 * Create an element and return the node itself, not an `el` wrapper. Takes the
 * same options as `el`, so a custom element comes back ready to talk to:
 *
 *   const form = create({ tag: 'x-search-form', parent: '#query-form' })
 *   form.onSubmit(...)   // its own methods, no `.el` hop
 *
 * Wrap it later with `new el(node)` if you want the chainable helpers.
 */
export function create<T extends HTMLElement = HTMLElement>(
  opts: elOpts,
  verbose: boolean = false,
): T {
  const node = new el(opts, verbose).el
  if (!node) {
    throw new Error(
      `could not create element: ${opts.tag ?? opts.query ?? '?'}`,
    )
  }
  return node as T
}

/*** component ***/

/**
 * Base class for custom elements. It handles registration, the component's
 * stylesheet, and a mount hook
 *   class SearchForm extends component {
 *     static tag = 'x-search-form'
 *     static styles = { input: { border: 'none' } }
 *     input = create({ tag: 'input' })
 *     mount() {
 *       this.input.addEventListener('keydown', (e) => ...)
 *       this.append(this.input)
 *     }
 *   }
 *   SearchForm.register()
 */
export class component extends HTMLElement {
  /** the name to register as; must contain a hyphen */
  static tag = ''
  /**
   * Injected once at `register()`, scoped to the tag. Written *relative* to the
   * component — no tag selector of its own — so it always matches whatever name
   * the class actually registered under.
   */
  static styles: style.declarations | null = null

  #mounted = false
  #pendingAttrs: [string, string | null, string | null][] = []

  /**
   * Inject this component's styles and define it. Idempotent, so calling it
   * twice (or after an HMR reload) is harmless.
   * @param tag - overrides `static tag`
   */
  static register(tag?: string) {
    const name = tag ?? this.tag
    if (!name) {
      throw new Error(
        `${this.name}: nothing to register as, set \`static tag = 'x-...'\``,
      )
    }
    // a subclass with no `tag` of its own inherits its parent's, which would
    // otherwise silently no-op against the parent's registration
    if (!name.includes('-')) {
      throw new Error(
        `${this.name}: '${name}' is not a valid custom element name, it needs a hyphen`,
      )
    }
    if (this.styles) {
      style.inject(name, this.styles)
    }
    registerElement(name, this as unknown as CustomElementConstructor)
  }

  /**
   * Called once, the first time the element is connected. Build the subtree and
   * wire listeners here — a custom element cannot give itself children before
   * it is connected, and `connectedCallback` runs again on every re-insertion.
   */
  mount() {}
  /**
   * Called every time the element is disconnected. Listeners on this element
   * and on children it owns go away with it; undo document/window listeners
   * here, using the removers `on()` and `onKey()` hand back.
   */
  unmount() {}
  /**
   * Called for every change to an attribute named in `static observedAttributes`,
   * and never before `mount()` — changes that arrive earlier (anything set at
   * creation or parse time, which the platform reports *before*
   * `connectedCallback`) are held and delivered in order right after mount.
   *
   * Attributes are strings. For structured data use a property with a setter
   * that re-renders; an object put through `setAttribute` becomes
   * "[object Object]".
   */
  onAttr(_name: string, _value: string | null, _prev: string | null) {}

  // A subclass that overrides these must call super, or the hooks stop firing.
  connectedCallback() {
    if (!this.#mounted) {
      this.#mounted = true
      this.mount()
      const queued = this.#pendingAttrs
      this.#pendingAttrs = []
      for (const [name, value, prev] of queued) {
        this.onAttr(name, value, prev)
      }
    }
  }
  disconnectedCallback() {
    this.unmount()
  }
  attributeChangedCallback(
    name: string,
    prev: string | null,
    value: string | null,
  ) {
    if (prev === value) return
    if (!this.#mounted) {
      this.#pendingAttrs.push([name, value, prev])
      return
    }
    this.onAttr(name, value, prev)
  }
}

/**
 * Get a template from a string
 * https://stackoverflow.com/a/41015840
 * @param  str    The string to interpolate
 * @param  params The parameters
 * @return The interpolated string
 */
export function interpolate(str: string, params: Object): string {
  let names = Object.keys(params).map((k) => `_${k}`)
  let vals = Object.values(params)
  return new Function(
    ...names,
    `return \`${str.replace(/\$\{(\w*)\}/g, '${_$1}')}\`;`,
  )(...vals)
}

export default { el, els, create, component, registerElement, ready, on, onKey }
