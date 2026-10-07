import type { Host, StateCell } from '../../hooks/host'
import State from '../../hooks/state'

/**
 * A Host over an in-memory store and state: what concern code saw and did, no engine involved.
 *
 * @param entries what the store holds at the start
 * @param userLanguage what Claude Code's `language` setting answers
 */
export function fakeHostOf(entries: Readonly<Record<string, unknown>> = {}, userLanguage?: string) {
  const stored = new Map<string, unknown>(Object.entries(entries))
  const sets: string[] = []
  const logs: string[] = []
  const state: Record<string, unknown> = JSON.parse(JSON.stringify(State.INITIAL_STATE))

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
  }

  return { host, stored, sets, logs, state }
}
