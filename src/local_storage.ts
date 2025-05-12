import { el } from './dom'

// smaller localStorage with events
export function get(key: string): any {
  return localStorage.getItem(key)
}
export function set(key: string, value: any, broadcast: boolean = false) {
  const prev = get(key)
  if (prev !== value || broadcast) {
    const event = new CustomEvent('@corvid/ls-update', {
      detail: { key, value },
    })
    document.dispatchEvent(event)
  }
  localStorage.setItem(key, value)
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
