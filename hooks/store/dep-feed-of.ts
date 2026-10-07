import type { DepFeed } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { textOf } from './text-of.js'

/**
 * A stored feed mapping, its known fields only and blank ones left out, or undefined when it is not one.
 *
 * @param value one stored mapping
 */
export function depFeedOf(value: unknown): DepFeed | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const { resolvedAt } = value

  if (typeof resolvedAt !== 'number' || !Number.isFinite(resolvedAt)) {
    return undefined
  }

  const repo = textOf(value.repo)?.trim()
  const feed = textOf(value.feed)?.trim()
  const reason = textOf(value.reason)?.trim()

  return {
    ...(repo ? { repo } : {}),
    ...(feed ? { feed } : {}),
    ...(reason ? { reason } : {}),
    resolvedAt,
    ...(value.isOverride === true ? { isOverride: true } : {}),
  }
}
