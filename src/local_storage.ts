import { el } from './dom'

// smaller localStorage with events
export function get(key: string, _default?: any): any {
  let ret = localStorage.getItem(key)
  if (ret === null && _default !== undefined && _default !== null) {
    ret = _default
    if (typeof _default === 'function') {
      ret = _default()
    }
    set(key, ret)
  }
  return ret
}
export function getJSON(key: string, _default?: any): any {
  const val = get(key, _default)
  if (val === null) {
    return null
  }
  try {
    return JSON.parse(val)
  } catch (e) {
    console.error(e)
    return val
  }
}

export function update(
  key: string,
  update: (current: any) => any,
  broadcast: boolean = false,
) {
  const prev = get(key)
  let value = update(prev)
  const v = value
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  localStorage.setItem(key, value)
  if (prev !== value || broadcast) {
    const event = new CustomEvent('@corvid/ls-update', {
      detail: { key, value: v },
    })
    document.dispatchEvent(event)
  }
}

// set: if key is an object, setObj will be called with value passed as a prefix
export function set(key: string, value: any, broadcast: boolean = false) {
  const v = value
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  const prev = get(key)
  localStorage.setItem(key, value)
  if (prev !== value || broadcast) {
    const event = new CustomEvent('@corvid/ls-update', {
      detail: { key, value: v },
    })
    document.dispatchEvent(event)
  }
}

const listeners = new Map<string, Map<Function, Function>>()

export function listen(
  key: string,
  cb: (update: { key: string; value: any }) => void | el,
) {
  // Create the wrapper function that will be used for add/remove
  const listener = (ev: any) => {
    if (ev.detail.key === key || key === '*') {
      if (cb instanceof el) {
        if (ev.detail.key === key) {
          cb.content(ev.detail.value)
        }
        return
      }
      cb({ key: ev.detail.key, value: ev.detail.value })
    }
  }

  // Store the mapping so we can remove it later
  if (!listeners.has(key)) {
    listeners.set(key, new Map())
  }
  listeners.get(key)!.set(cb, listener)

  document.addEventListener('@corvid/ls-update', listener)
}

export function unlisten(
  key: string,
  cb: (update: { key: string; value: any }) => void | el,
) {
  const keyListeners = listeners.get(key)
  if (!keyListeners) return

  const listener = keyListeners.get(cb)
  if (!listener) return

  document.removeEventListener(
    '@corvid/ls-update' as keyof DocumentEventMap,
    listener as EventListener,
  )
  keyListeners.delete(cb)

  if (keyListeners.size === 0) {
    listeners.delete(key)
  }
}

export function clear(key: string) {
  localStorage.removeItem(key)
}

export default {
  get,
  getJSON,
  set,
  update,
  listen,
  unlisten,
  clear,
}
