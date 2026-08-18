import { el } from './dom'

// TODO: add "mock" localstorage for running tests outside the browser

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

const listeners = new Map<
  string,
  Map<
    (update: { key: string; value: any }) => void | el,
    { custom: EventListener; storage: EventListener }
  >
>()

export function listen(
  key: string,
  cb: (update: { key: string; value: any }) => void | el,
) {
  // Same-tab: existing CustomEvent listener
  const customListener: EventListener = (ev) => {
    const customEv = ev as CustomEvent
    if (customEv.detail.key === key || '*' === key) {
      if (cb instanceof el) {
        if (customEv.detail.key === key) cb.content(customEv.detail.value)
        return
      }
      cb({ key: customEv.detail.key, value: customEv.detail.value })
    }
  }
  // Cross-tab: native storage event (only fires in OTHER tabs)
  const storageListener: EventListener = (ev) => {
    const storageEv = ev as StorageEvent
    if (storageEv.key === key || '*' === key) {
      let value = storageEv.newValue
      try {
        value = JSON.parse(value!)
      } catch (e) {
        /* leave as string */
      }
      if (cb instanceof el) {
        if (storageEv.key === key) cb.content(value)
        return
      }
      cb({ key: storageEv.key!, value })
    }
  }
  if (!listeners.has(key)) listeners.set(key, new Map())
  listeners
    .get(key)!
    .set(cb, { custom: customListener, storage: storageListener })
  document.addEventListener('@corvid/ls-update', customListener)
  window.addEventListener('storage', storageListener)
}

export function unlisten(
  key: string,
  cb: (update: { key: string; value: any }) => void | el,
) {
  const keyListeners = listeners.get(key)
  if (!keyListeners) return
  const listener = keyListeners.get(cb)
  if (!listener) return
  document.removeEventListener('@corvid/ls-update', listener.custom)
  window.removeEventListener('storage', listener.storage)
  keyListeners.delete(cb)
  if (0 === keyListeners.size) listeners.delete(key)
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
