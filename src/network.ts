import { logger, logLevel } from './utils'

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

/*** http request ***/
export type requestOpts = {
  url?: string
  type?: 'json'
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Object | params
  headers?: Record<string, string>
  auth?: string
  body?: Object
  success?: number
  credentials?: RequestCredentials
}
export class request {
  opts: requestOpts
  log: logger
  constructor(opts: requestOpts = {}, verbose: boolean = false) {
    this.log = new logger(verbose ? logLevel.debug : logLevel.none, 'request')
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
    if (!this.opts.credentials) {
      this.opts.credentials = 'omit'
    }
    this.log.debug(`with options: ${JSON.stringify(this.opts)}`)
  }
  auth(token: string) {
    const header = `Bearer ${token}`
    this.log.debug(`adding auth token header ${header}`)
    this.opts.headers!.Authorization = header
    return this
  }
  basicAuth(username: string, password: string) {
    const header = `Basic ${btoa(`${username}:${password}`)}`
    this.log.debug(`adding basic auth header ${header}`)
    this.opts.headers!.Authorization = header
    return this
  }
  body(body: Object) {
    this.opts.body = body
    return this
  }
  async do({
    path,
    params: passedParams,
    override,
  }: {
    path?: string
    params?: Object
    override?: {
      success?: number
      params?: Object
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
    let reqParams
    if (override.params || this.opts.params) {
      reqParams = new params(override.params || this.opts.params)
    }
    if (passedParams) {
      if (!reqParams) {
        reqParams = new params(passedParams)
      } else {
        reqParams = new params(reqParams).set(passedParams)
      }
    }
    if (reqParams) {
      url = `${url}?${reqParams.toString()}`
    }
    this.log.debug(`${this.opts.method} ${url}`)
    const res = await fetch(url, {
      method: this.opts.method,
      credentials: this.opts.credentials,
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

/*** websocket ***/
export class ws {
  url: string
  ws: WebSocket | null
  backoff = 100 // exponential backoff
  max_timeout = 10000 // 10 seconds
  should_reconnect = true
  is_connected = false
  recursion_level = 0
  reconnect_timer: number | null = null
  log: logger
  event_listeners: Record<string, Array<(data: any) => void>> = {}
  constructor(url: string, verbose: boolean = false) {
    this.url = url
    this.ws = null
    this.log = new logger(verbose ? logLevel.debug : logLevel.none, 'websocket')
    this.setup()
  }
  setup() {
    this.recursion_level += 1
    if (this.ws) {
      for (let key in this.event_listeners) {
        this.event_listeners[key].forEach((cb) => {
          this.ws!.removeEventListener(key, cb)
        })
      }
    }
    this.ws = new WebSocket(this.url)
    this.backoff = 100
    this.ws.addEventListener('open', () => {
      const rl = this.recursion_level
      this.log.debug(`on open: reconnected (${rl})`)
      this.is_connected = true

      if (!this.ws) return

      for (let key in this.event_listeners) {
        this.event_listeners[key].forEach((cb) => {
          if (this.ws) {
            this.log.debug(`adding listener (${rl}): ${key}`)
            this.ws.addEventListener(key, cb)
          }
        })
      }
    })
    this.ws.addEventListener('close', () => {
      this.log.debug('connection closed')

      this.is_connected = false
      this.backoff = Math.min(this.backoff * 2, this.max_timeout)
      this.log.debug(`backoff: ${this.backoff}`)
      this.reconnect_timer = window.setTimeout(
        () => {
          if (this.should_reconnect) {
            this.ws = null
            this.setup()
          }
        },
        this.backoff + 50 * Math.random(), // add jitter to avoid thundering herd
      )
    })
    this.ws.addEventListener('error', this.log.error)
  }
  send(data: any) {
    if (!this.is_connected || !this.ws) {
      throw new Error('not connected')
    }
    this.ws.send(JSON.stringify(data))
  }
  onMessage(cb: (data: any) => void) {
    if (!this.ws) {
      throw new Error('ws is null')
    }
    if (!this.event_listeners.message) {
      this.event_listeners.message = []
    }
    const handler = (e: MessageEvent) => {
      const rl = this.recursion_level
      this.log.debug(`message(${rl}): ${e.data}`)
      cb(e.data)
    }
    this.event_listeners.message.push(handler)
    this.ws.addEventListener('message', handler)
  }
  onJSON(cb: (data: any) => void) {
    this.onMessage((d) => cb(JSON.parse(d)))
  }
  on(event: string, cb: (data: any) => void) {
    if (!this.ws) {
      throw new Error('ws is null')
    }
    if (!this.event_listeners[event]) {
      this.event_listeners[event] = []
    }
    this.event_listeners[event].push(cb)
    this.ws.addEventListener(event, cb)
  }
  close() {
    if (this.reconnect_timer) {
      clearTimeout(this.reconnect_timer)
    }
    if (!this.is_connected || !this.ws) {
      return
    }
    this.should_reconnect = false
    this.ws.close()
  }
}

/*** refresh ***/
export class refresh {
  url: string
  should_reload = false
  constructor(url: string) {
    this.url = url
  }
  listen() {
    const socket = new ws(this.url)
    if (socket) {
      socket.on('open', () => {
        if (this.should_reload) {
          location.reload()
        }
      })
      socket.on('close', () => {
        this.should_reload = true
        setTimeout(this.listen, 500)
      })
    }
  }
}

/*** server sent events ***/
// export class sse {
//   sse: EventSource
//   constructor(url: string, withCredentials = false) {
//     this.sse = new EventSource(url, { withCredentials })
//     if (this.sse) {
//       this.on('close', () => {
//         console.log('connection closed')
//       })
//     }
//   }
//   event(cb: (data: any) => void) {
//     this.sse.addEventListener('message', (e) => {
//       cb(e.data)
//     })
//   }
//   on(event: string, cb: (data: any) => void) {
//     this.sse.addEventListener(event, cb)
//   }
//   close() {
//     this.sse.close()
//   }
// }
