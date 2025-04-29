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

export type requestOpts = {
  url?: string
  type?: 'json'
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: typeof params
  headers?: Record<string, string>
  auth?: string
  body?: Object
  success?: number
}
export class request {
  opts: requestOpts
  constructor(opts: requestOpts = {}) {
    if (opts.type && opts.type !== 'json') {
      throw new Error('this class only provides json requests')
    }
    if (!opts.url) {
      throw new Error('must provide url')
    }

    this.opts = opts
    if (!this.opts.success) {
      this.opts.success = 200
    }
    if (!this.opts.method) {
      this.opts.method = 'GET'
    }
    if (!this.opts.headers) {
      this.opts.headers = {}
    }
  }
  auth(token: string) {
    this.opts.headers!.Authorization = `Bearer ${token}`
    return this
  }
  basicAuth(username: string, password: string) {
    this.opts.headers!.Authorization =
      'Basic ' + btoa(username + ':' + password)
    return this
  }
  body(body: Object) {
    this.opts.body = body
    return this
  }
  async do({
    path,
    override,
  }: {
    path?: string
    override?: {
      success?: number
      params?: any
      body?: Object
    }
  } = {}) {
    if (this.opts.auth) {
      this.opts.headers!.Authorization = `Bearer ${this.opts.auth}`
    }
    if (!override) {
      override = {}
    }
    const body = override.body || this.opts.body
    let url = this.opts.url!
    if (path) {
      url = `${this.opts.url}${path}`
    }
    const params = override.params || this.opts.params
    if (params) {
      url = `${url}?${params.toString()}`
    }
    const res = await fetch(url, {
      method: this.opts.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...this.opts.headers,
      },
      body: JSON.stringify(body),
    })
    const success = override.success || this.opts.success
    if (res.status !== success) {
      const body = await res.json()
      throw new Error(
        `bad response ${res.status} !== ${success}, body: ${body}`,
      )
    }
    return await res.json()
  }
}
