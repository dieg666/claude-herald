import type { StackDep, StackProject } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { stackItemOf } from './stack-item-of.js'
import { textOf } from './text-of.js'

/**
 * A stored dependency entry, entries that are not items or ids dropped, or undefined when it is not one.
 *
 * @param value one stored dependency entry
 */
function stackDepOf(value: unknown): StackDep | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const { checkedAt } = value

  if (typeof checkedAt !== 'number' || !Number.isFinite(checkedAt)) {
    return undefined
  }

  const current = textOf(value.current)

  return {
    checkedAt,
    ...(current === undefined ? {} : { current }),
    seen: Array.isArray(value.seen)
      ? value.seen.filter((id): id is string => typeof id === 'string')
      : [],
    items: Array.isArray(value.items)
      ? value.items.flatMap(entry => {
          const item = stackItemOf(entry)

          return item === undefined ? [] : [item]
        })
      : [],
  }
}

/**
 * A stored project's stack releases, entries that are not one dropped; an empty record when it is not one.
 *
 * @param value one project's stored record under `stack`
 */
export function stackProjectOf(value: unknown): StackProject {
  const stored = isRecord(value) ? value : {}
  const { refreshedAt } = stored

  return {
    deps: Object.fromEntries(
      Object.entries(isRecord(stored.deps) ? stored.deps : {}).flatMap(([key, entry]) => {
        const dep = stackDepOf(entry)

        return dep === undefined ? [] : [[key, dep]]
      }),
    ),
    refreshedAt: typeof refreshedAt === 'number' && Number.isFinite(refreshedAt) ? refreshedAt : 0,
  }
}
