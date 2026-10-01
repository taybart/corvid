import { test, expect, describe, vi } from 'vitest'
import { request } from './network'

describe('request.do', () => {
  test('a non-401 bad response throws the typed error, not a raw body-read failure', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('server exploded', { status: 500 }),
    )
    const client = new request({ url: 'https://example.test', fetch })
    await expect(client.do({ path: '/x' })).rejects.toMatchObject({
      status: 500,
      body: 'server exploded',
    })
  })

  // The regression this guards: `onUnauthorized` resolving false used to fall
  // through past the throw and try to read the response body a second time
  // (res.json()/res.text(), after res.text() already consumed it above),
  // which throws a generic "body stream already read" TypeError instead of
  // this call's own typed `{status, body}` error.
  test('a 401 whose refresh fails still throws the typed error', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('nope', { status: 401 }),
    )
    const onUnauthorized = vi.fn().mockResolvedValue(false)
    const client = new request({ url: 'https://example.test', fetch, onUnauthorized })

    await expect(client.do({ path: '/x' })).rejects.toMatchObject({
      status: 401,
      body: 'nope',
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledOnce()
  })

  test('a 401 whose refresh succeeds retries once and returns the retried response', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
    const onUnauthorized = vi.fn().mockResolvedValue(true)
    const client = new request({ url: 'https://example.test', fetch, onUnauthorized })

    await expect(client.do({ path: '/x' })).resolves.toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('the retry only ever happens once, even if the second attempt is also a 401', async () => {
    // A fresh Response per call, as real fetch() would hand back — reusing
    // one instance (`mockResolvedValue`) would fail the second read for the
    // test's own reason, not the one this test is checking.
    const fetch = vi.fn().mockImplementation(async () => new Response('nope', { status: 401 }))
    const onUnauthorized = vi.fn().mockResolvedValue(true)
    const client = new request({ url: 'https://example.test', fetch, onUnauthorized })

    await expect(client.do({ path: '/x' })).rejects.toMatchObject({ status: 401 })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
