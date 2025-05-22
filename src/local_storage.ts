import { el } from './dom'

// smaller localStorage with events
export function get(key: string): any {
  return localStorage.getItem(key)
}
export function update(
  key: string,
  update: (current: any) => any,
  broadcast: boolean = false,
) {
  const prev = get(key)
  const value = update(prev)
  if (prev !== value || broadcast) {
    const event = new CustomEvent('@corvid/ls-update', {
      detail: { key, value },
    })
    document.dispatchEvent(event)
  }
  localStorage.setItem(key, value)
}
export function set(
  key: string | object,
  value: any,
  broadcast: boolean = false,
) {
  if (typeof key === 'object') {
    setObj(key, value, broadcast)
    return
  }
  const prev = get(key)
  if (prev !== value || broadcast) {
    const event = new CustomEvent('@corvid/ls-update', {
      detail: { key, value },
    })
    document.dispatchEvent(event)
  }
  localStorage.setItem(key, value)
}
export function setObj(
  update: object,
  prefix?: string,
  broadcast: boolean = false,
) {
  const flatten = (ob: any) => {
    const ret: Record<string, any> = {}

    for (let i in ob) {
      if (!ob.hasOwnProperty(i)) continue

      if (typeof ob[i] == 'object' && ob[i] !== null) {
        const flat = flatten(ob[i])
        for (let x in flat) {
          if (!flat.hasOwnProperty(x)) continue
          ret[`${i}.${x}`] = flat[x]
        }
      } else {
        ret[i] = ob[i]
      }
    }
    return ret
  }
  for (let [k, v] of Object.entries(flatten(update))) {
    let key = k
    if (prefix) {
      key = `${prefix}.${k}`
    }
    set(key, v, broadcast)
  }
}
export function listen(
  key: string,
  cb: (update: { key: string; value: any }) => void | el,
) {
  document.addEventListener('@corvid/ls-update', (ev: any) => {
    if (ev.detail.key === key || key === '*') {
      if (cb instanceof el) {
        if (ev.detail.key === key) {
          cb.content(ev.detail.value)
        }
        return
      }
      cb({ key: ev.detail.key, value: ev.detail.value })
    }
  })
}
