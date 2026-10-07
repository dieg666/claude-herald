import Detect from '../../hooks/deps/detect'
import { fakeFsOf } from './fake-fs-of.js'
import { fakeHostOf } from './fake-host-of.js'
import type { FakeFile } from './fake-file.js'

/**
 * Scans a fake project at `/repo`: every dependency declared (duplicates included), the files listed and read, and the debug lines.
 *
 * @param tree the project's files by relative path
 * @param limits the walk's limits, the default ones when absent
 */
export async function scanOf(
  tree: Readonly<Record<string, FakeFile>>,
  limits?: { maxDepth: number; maxDirs: number },
) {
  const fake = fakeHostOf()
  const fs = fakeFsOf('/repo', tree)

  Object.assign(fake.host, fs)

  const scan = await Detect.scanProject(fake.host, '/repo', Detect.DETECTORS, limits)

  return {
    dependencies: scan.dependencies,
    texts: scan.texts,
    lists: fs.lists,
    reads: fs.reads,
    logs: fake.logs,
  }
}
