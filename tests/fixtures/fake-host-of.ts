import type { ModelCompleteRequest, ModelCompleteResult } from 'claude-code'

import type { Host, StateCell } from '../../hooks/host'
import State from '../../hooks/state'

/**
 * A Host over an in-memory store, state, web and model: what concern code saw and did, no engine involved; the clock reads 1000.
 *
 * @param entries what the store holds at the start
 * @param userLanguage what Claude Code's `language` setting answers
 */
export function fakeHostOf(entries: Readonly<Record<string, unknown>> = {}, userLanguage?: string) {
  const stored = new Map<string, unknown>(Object.entries(entries))
  const sets: string[] = []
  const logs: string[] = []
  const state: Record<string, unknown> = JSON.parse(JSON.stringify(State.INITIAL_STATE))
  const web = new Map<string, { status: number; text: string } | Error>()
  const fetched: string[] = []
  const replies: ModelCompleteResult[] = []
  const asked: { request: ModelCompleteRequest; signal?: AbortSignal }[] = []
  const toasts: string[] = []
  const timers: { ms: number; fn: () => void; isCancelled: boolean }[] = []
  const afters: { ms: number; fn: () => void; isCancelled: boolean }[] = []

  const cellOf = <T>(key: keyof typeof State.INITIAL_STATE): StateCell<T> => ({
    read: async () => state[key] as T,
    update: async change => {
      const value = change(state[key] as T)

      state[key] = value

      return value
    },
  })

  const host: Host = {
    storeGet: async key => {
      const value = stored.get(key)

      return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
    },
    storeSet: async (key, value) => {
      sets.push(key)
      stored.set(key, JSON.parse(JSON.stringify(value)))
    },
    state: {
      sources: cellOf('sources'),
      settings: cellOf('settings'),
      items: cellOf('items'),
      saved: cellOf('saved'),
      summaries: cellOf('summaries'),
      band: cellOf('band'),
      pane: cellOf('pane'),
      status: cellOf('status'),
    },
    userLanguage: async () => userLanguage,
    debug: text => {
      logs.push(text)
    },
    httpFetch: async url => {
      fetched.push(url)

      const page = web.get(url) ?? new Error(`no page at ${url}`)

      if (page instanceof Error) {
        throw page
      }

      return { ...page, ok: page.status >= 200 && page.status < 300 }
    },
    modelComplete: async (request, signal) => {
      asked.push(signal === undefined ? { request } : { request, signal })

      return (
        replies.shift() ?? {
          isAnswered: false,
          reason: 'empty-reply',
          usage: {
            input_tokens: 0,
            output_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
        }
      )
    },
    toast: text => {
      toasts.push(text)
    },
    clockNow: async () => 1000,
    clockEvery: (ms, fn) => {
      const timer = { ms, fn, isCancelled: false }

      timers.push(timer)

      return {
        cancel: () => {
          timer.isCancelled = true
        },
      }
    },
    clockAfter: (ms, fn) => {
      const timer = { ms, fn, isCancelled: false }

      afters.push(timer)

      return {
        cancel: () => {
          timer.isCancelled = true
        },
      }
    },
    sessionRoot: async () => '/work',
    homeDir: async () => undefined,
    listDir: async path => {
      throw new Error(`ENOENT: ${path}`)
    },
    readText: async path => {
      throw new Error(`ENOENT: ${path}`)
    },
  }

  return { host, stored, sets, logs, state, web, fetched, replies, asked, toasts, timers, afters }
}
