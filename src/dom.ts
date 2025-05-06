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

/*** element ***/
type elOpts = {
  query?: string
  type?: string
  content?: any
  class?: string
  id?: string
  parent?: HTMLElement | el
}
export class el {
  el: HTMLElement | null
  query: string
  log: logger
  constructor(opts: string | elOpts, verbose: boolean = false) {
    this.log = new logger(verbose ? logLevel.debug : logLevel.none, 'element')
    this.query = ''
    if (typeof opts === 'string') {
      this.query = opts
      this.el = document.querySelector(opts)
      return
    }
    const {
      query,
      type,
      class: styleClass,
      id,
      content,
      parent,
    } = opts as elOpts
    if (query) {
      this.query = query
      this.el = document.querySelector(query)
      if (!this.el) {
        throw new Error(`no element from query: ${query}`)
      }
    } else if (type) {
      this.el = document.createElement(type)
    } else {
      throw new Error('no query or type provided')
    }
    if (this.el) {
      if (id) {
        this.el.id = id
      }
      if (styleClass) {
        this.el.classList.add(styleClass)
      }
      if (content) {
        this.el.innerHTML = content
      }
      if (parent) {
        parent.appendChild(this.el)
      }
    }
  }
  /*** dom manipulation ***/
  value(update?: string): string | el {
    if (!this.el) {
      throw new Error(`no element from query: ${this.query}`)
    }
    if (update) {
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

  /*** Events ***/
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
