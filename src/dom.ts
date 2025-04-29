/****************
 *     DOM      *
 ***************/

/*** window ***/
/**
 * onDomContentLoaded
 */
export function ready(cb: () => void) {
  window.addEventListener('DOMContentLoaded', cb)
}

/*** element ***/
type elOpts = {
  query?: string
  type?: string
  content?: any
  parent?: HTMLElement
  create?: boolean
}
export class el {
  el: HTMLElement | null
  name: string
  constructor(opts: string | elOpts) {
    if (typeof opts === 'string') {
      this.name = opts
      this.el = document.querySelector(opts)
      return
    }
    const { query, type, content, parent, create } = opts as elOpts
    if (query) {
      this.name = query
      this.el = document.querySelector(query)
      if (!this.el && type && create) {
        this.el = document.createElement(type)
      }
    } else if (type) {
      this.name = type
      this.el = document.createElement(type)
    } else {
      throw new Error('no query or type provided')
    }
    if (this.el && content) {
      this.el.innerHTML = content
    }
    if (this.el && parent) {
      parent.appendChild(this.el)
    }
  }
  /*** get ***/
  value(): string {
    if (this.el && this.el instanceof HTMLInputElement) {
      return this.el.value
    }
    return ''
  }
  /*** set ***/
  parent(parent: HTMLElement) {
    if (!this.el) {
      throw new Error(`no element from input: ${this.name}`)
    }
    parent.appendChild(this.el)
    return this
  }
  child(ch: HTMLElement) {
    if (!this.el) {
      throw new Error(`no element from input: ${this.name}`)
    }
    this.el?.appendChild(ch)
    return this
  }
  inner(
    content: any,
    { force = false, text = false }: { force?: boolean; text?: boolean } = {},
  ) {
    if (!this.el) {
      throw new Error(`no element from input: ${this.name}`)
    }
    if (this.el instanceof HTMLIFrameElement && !force) {
      this.el.src = content
    } else if (this.el instanceof HTMLInputElement && !force) {
      this.el.value = content
    } else {
      if (text) {
        this.el.textContent = content
      } else {
        this.el.innerHTML = content
      }
    }
    return this
  }
  src(url: string) {
    if (
      this.el instanceof HTMLIFrameElement ||
      this.el instanceof HTMLImageElement
    ) {
      this.el.src = url
    }
    return this
  }
  style(style: Object | string) {
    if (this.el) {
      if (typeof style === 'string') {
        this.el.style = style
      } else if (typeof style === 'object') {
        let s = ''
        Object.entries(style).forEach(([k, v]) => (s += `${k}:${v};`))
        this.el.style = s
      }
    }
    return this
  }
  addClass(className: string) {
    if (!this.el) {
      throw new Error(`no element from input: ${this.name}`)
    }
    this.el.classList.add(className)
    return this
  }
  removeClass(className: string) {
    if (!this.el) {
      throw new Error(`no element from input: ${this.name}`)
    }
    this.el.classList.remove(className)
    return this
  }

  listen(event: string, cb: (ev: Event) => void) {
    if (!this.el) {
      throw new Error(`no element from input: ${this.name}`)
    }
    this.el.addEventListener(event, cb)
    return this
  }
  onClick(cb: (ev: Event) => void) {
    return this.listen('click', cb)
  }
}

/*** url params ***/
export class params {
  params: URLSearchParams
  constructor(p?: Object) {
    this.params = new URLSearchParams()
    if (p) {
      for (let [k, v] of Object.entries(p)) {
        this.params.set(k, v)
      }
    }
    return this
  }
  set(p: Object) {
    for (let [k, v] of Object.entries(p)) {
      this.params.set(k, v)
    }
    return this
  }
  toString(): string {
    return this.params.toString()
  }
  static render(p: Object) {
    const params = new URLSearchParams()
    if (p) {
      for (let [k, v] of Object.entries(p)) {
        params.set(k, v)
      }
    }
    return params.toString()
  }
}
