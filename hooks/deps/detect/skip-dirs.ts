/**
 * Directories the walk never lists: installed packages (including Elixir's `deps`), virtual environments and build output; every dot-directory is skipped too.
 */
export const SKIP_DIRS: ReadonlySet<string> = new Set([
  'node_modules',
  'vendor',
  '.venv',
  'venv',
  '__pycache__',
  'target',
  'dist',
  'build',
  '_build',
  'deps',
  'Pods',
])
