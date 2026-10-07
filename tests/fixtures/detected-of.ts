import type { DepsSettings } from '../../types/index.js'
import Detect from '../../hooks/deps/detect'
import { fakeFsOf } from './fake-fs-of.js'
import { fakeHostOf } from './fake-host-of.js'
import type { FakeFile } from './fake-file.js'

/**
 * Detects a fake project at `/repo` with these settings and answers what the store keeps for it.
 *
 * @param tree the project's files by relative path
 * @param settings the project's stored settings
 */
export async function detectedOf(
  tree: Readonly<Record<string, FakeFile>>,
  settings: Partial<DepsSettings> = {},
) {
  const fake = fakeHostOf({ deps: { '/repo': { settings } } })
  const fs = fakeFsOf('/repo', { '.git': { isDir: true }, ...tree })

  Object.assign(fake.host, fs)

  const project = await Detect.detectDeps(fake.host)

  return { project, logs: fake.logs, lists: fs.lists, reads: fs.reads, stored: fake.stored }
}
