export type requestOpts = {
  url: string
  type: 'json'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers: Record<string, string>
  auth: string
  body: Object
  success: number
}
export class request {
  opts: requestOpts
  constructor(opts: requestOpts) {
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
    this.opts.headers.Authorization = `Bearer ${token}`
    return this
  }
  basicAuth(username: string, password: string) {
    this.opts.headers.Authorization = 'Basic ' + btoa(username + ':' + password)
    return this
  }
  body(body: Object) {
    this.opts.body = body
    return this
  }
  async do({
    path,
    overrideBody,
    overrideSuccess,
  }: {
    path?: string
    overrideBody?: Object
    overrideSuccess?: number
  } = {}) {
    if (this.opts.auth) {
      this.opts.headers.Authorization = `Bearer ${this.opts.auth}`
    }
    const body = overrideBody || this.opts.body
    let url = this.opts.url
    if (path) {
      url = `${this.opts.url}${path}`
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
    const success = overrideSuccess || this.opts.success
    if (res.status !== success) {
      const body = await res.json()
      throw new Error(
        `bad response ${res.status} !== ${this.opts.success}, body: ${body}`,
      )
    }
    return await res.json()
  }
}
