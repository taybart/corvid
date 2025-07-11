/***************
 *    Utils    *
 **************/

/**
 * Generates a random id of length len using provided alphabet
 * @param len - The length of the string to generate
 * @param [alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'] - The set of characters to use
 * @return A new random id
 */
export function genID(
  len: number = 15,
  alphabet: string = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
  return [...crypto.getRandomValues(new Uint8Array(len))]
    .map((value) => alphabet[Math.floor((value / 255) * alphabet.length)])
    .join('')
}

/**
 * Clipboard helper because i can't remember the funciton names
 */
export const clipboard = {
  check() {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported, or context is not https')
    }
  },
  async copy(text: string) {
    this.check()
    await navigator.clipboard.writeText(text)
  },
  async copyArbitrary(data: any) {
    this.check()
    await navigator.clipboard.write(data)
  },
  async read(): Promise<string> {
    this.check()
    return await navigator.clipboard.readText()
  },
  async readArbitrary(): Promise<any> {
    this.check()
    return await navigator.clipboard.read()
  },
  listen(query: string | HTMLElement, cb: (contents: string) => string) {
    let el
    if (typeof query === 'string') {
      el = document.querySelector(query)
    } else {
      el = query
    }
    if (!el) {
      throw new Error(`no element from query: ${query}`)
    }
    el.addEventListener('copy', (ev: Event) => {
      const cbEv = ev as ClipboardEvent
      const selection = document.getSelection()
      if (selection) {
        const text = selection.toString()
        if (text && cbEv.clipboardData) {
          cbEv.clipboardData.setData('text/plain', cb(text))
        }
      }
    })
  },
}

export enum logLevel {
  none = -1,
  error = 0,
  warn = 1,
  info = 2,
  debug = 3,
  trace = 4,
}
export class logger {
  level: logLevel
  prefix: string
  constructor(level: logLevel = logLevel.info, prefix?: string) {
    this.level = level
    this.prefix = prefix ? `(${prefix}):` : ':'
    // mock calls if level is none
    if (this.level === logLevel.none) {
      // prettier-ignore
      ;['error', 'warn', 'info', 'debug', 'trace', 'log']
        .forEach((methodName) => { (this as any)[methodName] = () => { } })
    }
  }
  error(...args: any[]) {
    if (this.level >= logLevel.error) {
      console.error(`[corvid] ${this.prefix}`, ...args)
    }
  }
  warn(...args: any[]) {
    if (this.level >= logLevel.warn) {
      console.warn(`[corvid] ${this.prefix}`, ...args)
    }
  }
  info(...args: any[]) {
    if (this.level >= logLevel.info) {
      console.info(`[corvid] ${this.prefix}`, ...args)
    }
  }
  debug(...args: any[]) {
    if (this.level >= logLevel.debug) {
      console.debug(`[corvid] ${this.prefix}`, ...args)
    }
  }
  trace(...args: any[]) {
    if (this.level >= logLevel.trace) {
      console.trace(`[corvid] ${this.prefix}`, ...args)
    }
  }
  log(...args: any[]) {
    console.log(`[corvid] ${this.prefix}`, ...args)
  }
}
