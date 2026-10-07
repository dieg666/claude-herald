import type { On } from 'claude-code'

import { fakeFsOf } from './fake-fs-of.js'
import type { FakeFile } from './fake-file.js'

/**
 * Answers `$.session.root`, `$.fs.list` and `$.fs.read` from a fake project at `/repo`, recording each call.
 *
 * @param on the test's registrar
 * @param tree the project's files by relative path
 */
export function fsOn(on: On, tree: Readonly<Record<string, FakeFile>>) {
  const fs = fakeFsOf('/repo', tree)

  on('session.root', async () => ({ value: await fs.sessionRoot() }))
  on('fs.list', async ($, e) =>
    fs.listDir(e.path).then(
      value => ({ value: [...value] }),
      (error: Error) => ({ deny: error.message }),
    ),
  )
  on('fs.read', async ($, e) =>
    fs.readText(e.path).then(
      value => ({ value }),
      (error: Error) => ({ deny: error.message }),
    ),
  )

  return fs
}
