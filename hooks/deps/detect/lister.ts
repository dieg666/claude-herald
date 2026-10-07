import type { FsEntry } from 'claude-code'

/**
 * Lists a directory relative to the root at most once per detection, entries sorted by name; undefined when it cannot be read or the listing budget is spent.
 */
export type Lister = (dir: string) => Promise<readonly FsEntry[] | undefined>
