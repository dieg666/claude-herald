import type {
  ModelCompleteRequest,
  ModelCompleteResult,
  PaneOpenArgs,
  ProcessRunInit,
  ProcessRunResult,
  RenderSurface,
  UiCopyResult,
} from 'claude-code'

import type { Host, StateCell } from '../../hooks/host'
import State from '../../hooks/state'

/**
 * A Host over an in-memory store, state, web, model and surfaces (none attached until a test adds one): what concern code saw and did, no engine involved; the clock reads 1000; programs answer from `programs` by name (exit 0 when absent), the clipboard copies unless `copyResult` says otherwise, and `OS` is unset until a test sets `env.OS`.
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
  const headers: (Record<string, string> | undefined)[] = []
  const replies: ModelCompleteResult[] = []
  const asked: { request: ModelCompleteRequest; signal?: AbortSignal }[] = []
  const toasts: string[] = []
  const timers: { ms: number; fn: () => void; isCancelled: boolean }[] = []
  const afters: { ms: number; fn: () => void; isCancelled: boolean }[] = []
  const surfaces: RenderSurface[] = []
  const opened: PaneOpenArgs[] = []
  const runs: { argv: readonly string[]; init?: ProcessRunInit }[] = []
  const programs = new Map<string, Partial<ProcessRunResult> | Error>()
  const env: { OS?: string } = {}
  const copies: { text: string; surface: RenderSurface }[] = []
  const copyResult: { value: UiCopyResult | Error } = { value: { isCopied: true } }
  const transcript: string[] = []

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
      stack: cellOf('stack'),
    },
    userLanguage: async () => userLanguage,
    debug: text => {
      logs.push(text)
    },
    httpFetch: async (url, init) => {
      fetched.push(url)
      headers.push(init?.headers)

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
    surfaces: async () => [...surfaces],
    openPane: async pane => {
      opened.push(pane)

      return { isPlaced: true }
    },
    processRun: async (argv, init) => {
      runs.push(init === undefined ? { argv } : { argv, init })

      const answer = programs.get(argv[0] ?? '') ?? {}

      if (answer instanceof Error) {
        throw answer
      }

      return {
        exitCode: 0,
        stdout: '',
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
        ...answer,
      }
    },
    osVariable: async () => env.OS,
    copy: async (text, surface) => {
      copies.push({ text, surface })

      if (copyResult.value instanceof Error) {
        throw copyResult.value
      }

      return copyResult.value
    },
    log: text => {
      transcript.push(text)
    },
  }

  return {
    host,
    stored,
    sets,
    logs,
    state,
    web,
    fetched,
    headers,
    replies,
    asked,
    toasts,
    timers,
    afters,
    surfaces,
    opened,
    runs,
    programs,
    env,
    copies,
    copyResult,
    transcript,
  }
}
