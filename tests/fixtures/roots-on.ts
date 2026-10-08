import type { On } from 'claude-code'

/**
 * Answers `$.session.root` with whichever root the test sets in the returned cell, and `$.fs.list` with a `.git` directory at each of those roots (nothing below them).
 *
 * @param on the test's registrar
 * @param roots the project roots, the first one current at the start
 */
export function rootsOn(on: On, roots: readonly string[]): { current: string } {
  const cell = { current: roots[0] ?? '/repo' }

  on('session.root', () => ({ value: cell.current }))
  on('fs.list', ($, e) =>
    roots.includes(e.path)
      ? { value: [{ name: '.git', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }] }
      : { deny: `ENOENT: ${e.path}` },
  )

  return cell
}
