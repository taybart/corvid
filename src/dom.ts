/***************
 *    DOM      *
 ***************/
export function ready(cb: () => void) {
  window.addEventListener('DOMContentLoaded', cb)
}

export class btn {
  el: Element | null
  constructor(id: string, content: string) {
    this.el = null
    if (id) {
      this.el = document.getElementById(id)
      if (this.el && content) {
        this.el.innerHTML = content
      }
    }
  }
  onClick(cb: (ev: Event) => void) {
    this.el?.addEventListener('click', cb)
  }
}
export class form {
  el: Element | null
  constructor(id: string) {
    this.el = null
    if (id) {
      this.el = document.getElementById(id)
    }
  }
  byID(id: string) {
    this.el = document.getElementById(id)
    return this
  }
  onChange(cb: (ev: Event) => void) {
    this.el?.addEventListener('change', cb)
  }
}
export class el {
  el: HTMLElement | null
  constructor({
    id,
    type,
    content,
  }: {
    id: string
    type: string
    content?: any
  }) {
    if (id) {
      this.el = document.getElementById(id)
    } else if (type) {
      this.el = document.createElement(type)
    } else {
      throw new Error('no id or type provided')
    }
    if (this.el && content) {
      this.el.innerHTML = content
    }
  }
  child(ch: HTMLElement) {
    this.el?.appendChild(ch)
    return this
  }
  // TODO: check if should use value or innerHTML
  inner(content: any) {
    if (this.el) {
      this.el.innerHTML = content
    }
    return this
  }
  src(url: string) {
    // TODO: check img blah blah
    if (this.el instanceof HTMLIFrameElement) {
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
  onClick(cb: (ev: Event) => void) {
    this.el?.addEventListener('click', cb)
    return this
  }
  listen(event: string, cb: (ev: Event) => void) {
    this.el?.addEventListener(event, cb)
    return this
  }
}

export class params {
  params: URLSearchParams
  constructor() {
    this.params = new URLSearchParams()
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
}

export const ls = {
  get(k: string) {
    return localStorage.getItem(k)
  },
  set(k: string, v: any) {
    localStorage.setItem(k, v)
  },
}
