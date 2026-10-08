import type { Source, SourceKind } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { refreshSource } from '../refresh/refresh-source.js'
import { loadSources } from '../store/load-sources.js'
import { saveSources } from '../store/save-sources.js'
import { addRefusalOf } from './add-refusal-of.js'
import { uniqueIdOf } from './unique-id-of.js'
import { uniqueNameOf } from './unique-name-of.js'

/**
 * Adds a source at the end of the list, reading the store right before writing, mirrors the list to state and starts its first refresh, not awaited.
 *
 * @param host the engine
 * @param draft its address and kind, the name the person gave it if any, and the name to start from otherwise (made unique)
 * @returns the source as saved, or why it was refused
 */
export async function saveNewSource(
  host: Host,
  draft: { url: string; kind: SourceKind; name: string | undefined; title: string },
): Promise<{ readonly source: Source } | { readonly error: string }> {
  const sources = await loadSources(host)
  const refusal = addRefusalOf(sources, draft.url, draft.name)

  if (refusal !== undefined) {
    return { error: refusal }
  }

  const name = draft.name ?? uniqueNameOf(draft.title, sources)

  const source: Source = {
    id: uniqueIdOf(name, sources),
    name,
    url: draft.url,
    kind: draft.kind,
    isEnabled: true,
    isFactory: false,
  }

  const next = [...sources, source]

  await saveSources(host, next)
  await host.state.sources.update(() => next)

  void refreshSource(host, source)

  return { source }
}
