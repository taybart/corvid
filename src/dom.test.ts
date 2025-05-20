import { test, expect, describe, mock } from 'bun:test'
import { fireEvent } from '@testing-library/dom'
import * as dom from './dom'

describe('dom', () => {
  test('create element', () => {
    const div = new dom.el({
      type: 'div',
      id: 'test',
      content: 'hopefully this passes!',
      parent: window.document.body,
      class: 'cool-div',
      style: {
        color: 'red',
      },
    })
    expect(div.value()).toBe('hopefully this passes!')

    // check it was successfully created
    const test_div = window.document.getElementById('test')
    expect(test_div).toBeTruthy()
    expect(test_div?.id).toBe('test')
    expect(test_div?.innerText).toBe('hopefully this passes!')
    expect(test_div?.tagName).toBe('DIV')
    expect(test_div?.classList).toContain('cool-div')
    expect(test_div?.style.color).toBe('red')
  })

  test('query element', () => {
    const id_div = new dom.el('#test')
    expect(id_div.value()).toBe('hopefully this passes!')
    const class_div = new dom.el('.cool-div')
    expect(class_div.value()).toBe('hopefully this passes!')
  })

  test('element event', () => {
    const div = new dom.el('#test')
    const cb = mock()
    div.on('click', cb)
    fireEvent.click(div.el!)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('fires callback onKey', () => {
    const cb = mock(({ ctrl }) => {
      expect(ctrl).toBeTruthy()
    })
    dom.onKey('a', cb)
    fireEvent.keyDown(window, {
      key: 'a',
      ctrlKey: true,
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
