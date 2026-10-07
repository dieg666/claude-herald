import type { Host } from '../../hooks/host'
import { fakeHostOf } from './fake-host-of.js'

/**
 * Lets pending promise chains run as far as they can without the clock moving.
 */
async function settle(): Promise<void> {
  for (let tick = 0; tick < 200; tick += 1) {
    await Promise.resolve()
  }
}

/**
 * A fake Host whose clock only moves when the test advances it, firing `clockAfter` timers as they come due.
 *
 * @param entries what the store holds at the start
 * @param start the time the clock reads at the start
 */
export function clockedHostOf(entries: Readonly<Record<string, unknown>> = {}, start = 0) {
  const fake = fakeHostOf(entries)
  const waits: { at: number; ms: number; fn: () => void; isDone: boolean }[] = []
  let now = start

  const host: Host = {
    ...fake.host,
    clockNow: async () => now,
    clockAfter: (ms, fn) => {
      const wait = { at: now + ms, ms, fn, isDone: false }

      waits.push(wait)

      return {
        cancel: () => {
          wait.isDone = true
        },
      }
    },
  }

  const clock = {
    now: () => now,
    settle,
    /** Moves the clock on, firing each wait due on the way in time order. */
    advance: async (ms: number) => {
      const end = now + ms

      await settle()

      for (;;) {
        const due = waits
          .filter(wait => !wait.isDone && wait.at <= end)
          .sort((a, b) => a.at - b.at)[0]

        if (due === undefined) {
          break
        }

        now = due.at
        due.isDone = true
        due.fn()
        await settle()
      }

      now = end
      await settle()
    },
    /** The lengths of every wait asked for so far, in order. */
    waitsAsked: () => waits.map(wait => wait.ms),
  }

  return { ...fake, host, clock }
}
