import type { Get } from './get.js'
import type { Lookup } from './lookup.js'

/**
 * Reads a lookup from one version's document: the version in use first, else (or when that one is gone) the newest the registry lists.
 *
 * @param get the gentle fetch
 * @param inUse the version in use, already safe for a URL
 * @param newest the registry's newest version, undefined when it lists none
 * @param documentOf the version's document URL
 * @param read the lookup from the document
 */
export async function lookupVersioned(
  get: Get,
  inUse: string | undefined,
  newest: () => Promise<Lookup | { kind: 'version'; version: string }>,
  documentOf: (version: string) => string,
  read: (text: string) => Lookup,
): Promise<Lookup> {
  if (inUse !== undefined) {
    const outcome = await get(documentOf(inUse))

    if (outcome.kind === 'ok') {
      return read(outcome.text)
    }

    if (outcome.kind === 'failed') {
      return outcome
    }
  }

  const latest = await newest()

  if (latest.kind !== 'version') {
    return latest
  }

  const outcome = await get(documentOf(latest.version))

  if (outcome.kind === 'missing') {
    return { kind: 'none', reason: `not found in the registry (HTTP ${outcome.status})` }
  }

  return outcome.kind === 'failed' ? outcome : read(outcome.text)
}
