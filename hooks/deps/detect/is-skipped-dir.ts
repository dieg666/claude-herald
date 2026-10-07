import { SKIP_DIRS } from './skip-dirs.js'

/**
 * Whether a directory name is never walked into: a dot-directory or one of the skipped names.
 *
 * @param name the directory's name
 */
export function isSkippedDir(name: string): boolean {
  return name.startsWith('.') || SKIP_DIRS.has(name)
}
