/**
 * The GitHub repository a Go module path names without asking anyone: `github.com/owner/repo/...` (a `/vN` major suffix or a subdirectory included) and `golang.org/x/name`, mirrored at `golang/name`.
 *
 * @param module the module path
 */
export function goModuleRepoOf(module: string): string | undefined {
  const github = /^github\.com\/([\w-]+)\/([\w.-]+)(?:\/|$)/i.exec(module)

  if (github !== null) {
    return `${github[1] ?? ''}/${(github[2] ?? '').replace(/\.git$/i, '')}`
  }

  const x = /^golang\.org\/x\/([\w.-]+)(?:\/|$)/.exec(module)

  return x === null ? undefined : `golang/${x[1] ?? ''}`
}
