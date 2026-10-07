import type { Get } from './get.js'
import { jsonOf } from './json-of.js'
import type { Lookup } from './lookup.js'

/**
 * Fetches a registry's JSON document and reads a lookup (or what the caller needs next) from it; a 404 is a definite not-found, a body that is not a JSON object a failure.
 *
 * @param get the gentle fetch
 * @param url the document
 * @param read the lookup from the parsed object
 */
export async function lookupJson<T = Lookup>(
  get: Get,
  url: string,
  read: (json: Record<string, unknown>) => T,
): Promise<T | Lookup> {
  const outcome = await get(url)

  if (outcome.kind === 'missing') {
    return { kind: 'none', reason: `not found in the registry (HTTP ${outcome.status})` }
  }

  if (outcome.kind === 'failed') {
    return outcome
  }

  const json = jsonOf(outcome.text)

  return json === undefined
    ? { kind: 'failed', reason: 'the registry answer is not JSON' }
    : read(json)
}
