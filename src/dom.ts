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
  parent?: HTMLElement | el
  create?: boolean
}
export class el {
  el: HTMLElement | null
  query: string
  constructor(opts: string | elOpts) {
    this.query = ''
    if (typeof opts === 'string') {
      this.query = opts
      this.el = document.querySelector(opts)
      return
    }
    const { query, type, content, parent, create } = opts as elOpts
    if (query) {
      this.query = query
      this.el = document.querySelector(query)
      if (!this.el && type && create) {
        this.el = document.createElement(type)
      }
    } else if (type) {
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
  parent(parent: HTMLElement | el) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    parent.appendChild(this.el)
    return this
  }
  // For compatibility, should use child
  appendChild(ch: HTMLElement | el) {
    this.child(ch)
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
  inner(
    content: any,
    { force = false, text = false }: { force?: boolean; text?: boolean } = {},
  ) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
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
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.classList.add(className)
    return this
  }
  removeClass(className: string) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.classList.remove(className)
    return this
  }

  listen(event: string, cb: (ev: Event) => void) {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    this.el.addEventListener(event, cb)
    return this
  }
  onClick(cb: (ev: Event) => void) {
    return this.listen('click', cb)
  }
}
