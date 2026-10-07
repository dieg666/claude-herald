import Detect from '../../hooks/deps/detect'
import { fakeFsOf } from './fake-fs-of.js'
import { fakeHostOf } from './fake-host-of.js'
import type { FakeFile } from './fake-file.js'

/**
 * A detection Lister over a fake project at `/repo`, with what it listed and logged.
 *
 * @param tree the project's files by relative path
 * @param maxDirs the listing budget
 */
export function listerOn(tree: Readonly<Record<string, FakeFile>>, maxDirs = 500) {
  const fake = fakeHostOf()
  const fs = fakeFsOf('/repo', tree)

  Object.assign(fake.host, fs)

  const list = Detect.listerOf(fake.host, '/repo', maxDirs, text => fake.logs.push(text))

  return { list, lists: fs.lists, logs: fake.logs, host: fake.host }
}
