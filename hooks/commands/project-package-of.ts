import type { Dependency } from '../../types/index.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { typedPackageOf } from './typed-package-of.js'

/**
 * The package a `/news deps` subcommand names: `<ecosystem>:<name>` (spelled as the candidate it names ignoring case, else as typed), or a bare name when exactly one of the candidates has it (exactly, else ignoring case); otherwise why not.
 *
 * @param text what the person typed
 * @param candidates the packages a bare name may name
 */
export function projectPackageOf(
  text: string,
  candidates: readonly Pick<Dependency, 'ecosystem' | 'name'>[],
): { readonly pkg: Pick<Dependency, 'ecosystem' | 'name'> } | { readonly error: string } {
  const typed = typedPackageOf(text)

  if (typed !== undefined) {
    const known = candidates.find(
      candidate =>
        candidate.ecosystem === typed.ecosystem &&
        candidate.name.toLowerCase() === typed.name.toLowerCase(),
    )

    return { pkg: known === undefined ? typed : { ecosystem: known.ecosystem, name: known.name } }
  }

  const exact = candidates.filter(candidate => candidate.name === text)
  const matches =
    exact.length > 0
      ? exact
      : candidates.filter(candidate => candidate.name.toLowerCase() === text.toLowerCase())
  const keys = [...new Set(matches.map(depFeedKeyOf))]
  const [first] = matches

  if (first === undefined) {
    return {
      error: `No package here is named "${text}"; write it as <ecosystem>:<name>, e.g. npm:${text}.`,
    }
  }

  return keys.length === 1
    ? { pkg: { ecosystem: first.ecosystem, name: first.name } }
    : { error: `"${text}" names ${keys.join(' and ')}; write the one you mean.` }
}
