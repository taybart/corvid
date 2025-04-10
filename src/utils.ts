/***************
 *    Utils    *
 **************/

/**
 * Converts bytes to a human-readable string representation
 *
 * @param {number} bytes - The number of bytes to convert
 * @param {Object} options - Optional configuration
 * @param {boolean} options.useSI - If true, use SI units (KB, MB, GB) with powers of 1000
 *                                 If false, use binary units (KiB, MiB, GiB) with powers of 1024
 * @param {number} options.decimals - Number of decimal places to include (default: 2)
 * @return {string} Human-readable representation (e.g., "4.2 MB" or "3.7 GiB")
 */
export type Options = {
  useSI?: boolean
  decimals?: number
  includeUnits?: boolean
  targetUnit?: string
}
export function bytesToHuman(bytes: string, options: Options = {}) {
  const {
    useSI = false,
    decimals = 2,
    includeUnits = true,
    targetUnit = null,
  } = options

  const unit = useSI ? 1000 : 1024
  const units = useSI
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  // If no target unit specified, use the auto-scaling behavior
  if (targetUnit === null) {
    let val = parseInt(bytes, 10)
    if (Math.abs(val) < unit) {
      return `${bytes} B`
    }

    let u = 0
    while (Math.abs(val) >= unit && u < units.length - 1) {
      val /= unit
      u++
    }

    if (includeUnits) {
      return `${val.toFixed(decimals)} ${units[u]}`
    }
    return `${val.toFixed(decimals)}`
  }

  // If target unit is specified, convert directly to that unit
  const targetUnitIndex = units.indexOf(targetUnit)

  if (targetUnitIndex === -1) {
    throw new Error(
      `Invalid unit: ${targetUnit}. Valid units are: ${units.join(', ')}`,
    )
  }

  // Convert bytes to the target unit
  let val = parseInt(bytes, 10)
  for (let i = 0; i < targetUnitIndex; i++) {
    val /= unit
  }

  if (includeUnits) {
    return `${val.toFixed(decimals)} ${targetUnit}`
  }
  return `${val.toFixed(decimals)}`
}

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

export type RequestOptions = {
  url: string
  type: 'json'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers: Record<string, string>
  auth: string
  body: Object
  success: number
}
export class request {
  opts: RequestOptions
  constructor(opts: RequestOptions) {
    if (opts.type && opts.type !== 'json') {
      throw new Error('this class only provides json requests')
    }
    this.opts = opts
    if (!this.opts.success) {
      this.opts.success = 200
    }
    if (!this.opts.headers) {
      this.opts.headers = {}
    }
  }
  auth(token: string) {
    this.opts.headers.Authorization = `Bearer ${token}`
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
    path: string
    overrideBody: Object
    overrideSuccess: number
  }) {
    if (this.opts.auth) {
      this.opts.headers.Authorization = `Bearer ${this.opts.auth}`
    }
    const body = overrideBody || this.opts.body
    const res = await fetch(`${this.opts.url}${path}`, {
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
