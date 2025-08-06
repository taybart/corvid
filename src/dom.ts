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

/*** element ***/
type elOpts = {
  element?: HTMLElement
  query?: string
  type?: string
  content?: any
  class?: string | string[]
  style?: Object
  id?: string
  parent?: HTMLElement | el
}
export class el {
  el: HTMLElement | null
  query = ''
  log: logger
  listeners: Record<string, Array<(ev: Event) => void>> = {}
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
      query, element, type, class: styleClass, style, id, content, parent,
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
    } else if (type) {
      this.query = type
      this.log.debug(`creating element: ${type}`)
      this.el = document.createElement(type)
    } else {
      throw new Error('no query or type provided')
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
        parent.appendChild(this.el)
      }
    }
  }
  static query(query: string, verbose: boolean = false) {
    return new el(query, verbose)
  }

  /*** dom manipulation ***/
  value(update?: string): string | el {
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
  parent(parent: HTMLElement | el) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    parent.appendChild(this.el)
    return this
  }
  // For compatibility, should use child
  appendChild(ch: HTMLElement | el) {
    return this.child(ch)
  }
  child(ch: HTMLElement | el) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (ch instanceof el) {
      this.el.appendChild(ch!.el!)
    } else {
      this.el.appendChild(ch)
    }
    return this
  }
  prependChild(ch: HTMLElement | el) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (ch instanceof el) {
      this.el.prepend(ch!.el!)
    } else {
      this.el.prepend(ch)
    }
    return this
  }
  empty() {
    if (this.el) {
      this.el.innerHTML = ''
    }
    return this
  }
  content(content: any, { text = false }: { text?: boolean } = {}) {
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
  src(url: string) {
    if (this.el && 'src' in this.el) {
      this.el.src = url
    }
    return this
  }

  /*** Style ***/
  style(update: Object | string, stringify = false) {
    if (this.el) {
      if (typeof update === 'string') {
        this.el.style = update
      } else if (typeof update === 'object') {
        if (!stringify) {
          for (const [k, v] of Object.entries(update)) {
            // @ts-ignore
            this.el.style[k] = v
          }
          return
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
  addClass(className: string | string[]) {
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
  removeClass(className: string | string[]) {
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
  /*** Templates ***/
  html(content: string) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.innerHTML = content
  }
  render(vars = {}) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    try {
      return interpolate(this.el.innerHTML, vars)
    } catch (e) {
      throw new Error(`could not render template ${this.query}: ${e}`)
    }
  }
  // TODO: maybe should return first node in template as el
  appendTemplate(template: el, vars: any) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (!template.el) {
      throw new Error(`template does not contain element`)
    }
    const tmpl = template.render(vars)
    this.el.insertAdjacentHTML('beforeend', tmpl)
  }

  /*** Events ***/
  on(event: string, cb: (ev: Event) => void) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(cb)
    this.el.addEventListener(event, cb)
    return this
  }
  listen(event: string, cb: (ev: Event) => void) {
    return this.on(event, cb)
  }
  removeListeners(event: string) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (!this.listeners[event]) {
      return this
    }
    for (const cb of this.listeners[event]) {
      this.el.removeEventListener(event, cb)
    }
    this.listeners[event] = []
    return this
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

export default { el, els, ready, on, onKey }
