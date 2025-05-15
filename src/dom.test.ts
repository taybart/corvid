import { test, expect, describe, mock } from 'bun:test'
import { fireEvent } from '@testing-library/dom'
import * as dom from './dom'

describe('dom', () => {
  test('ready', () => {
    dom.ready(() => {
      expect(window.document.body).toBeTruthy()
    })
  })

  test('create element', () => {
    dom.ready(() => {
      new dom.el({ type: 'div', id: 'test', content: 'hopefully this passes!' })
      const test_div = window.document.getElementById('test')
      expect(test_div?.innerText).toBe('hopefully this passes!')
    })
  })

  test('fires callback onKey', () => {
    const cb = mock()
    dom.onKey('a', cb)
    fireEvent.keyDown(window.document.body, {
      key: 'a',
      ctrlKey: true,
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
