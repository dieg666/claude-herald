import type { Dependency } from '../../../types/index.js'
import { ECOSYSTEM_ALIASES } from './ecosystem-aliases.js'

/**
 * A name lowercased with runs of `-`, `_` and `.` as one `-`, as PyPI compares names.
 *
 * @param name a package name or path
 */
function normalOf(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-')
}

/**
 * Whether the package a tag names is this dependency: its full name, its last `/` or `:` part (`pkg` of `@scope/pkg`, the artifact of `group:artifact`), the trailing directories of a Go module path (`service/s3` of `github.com/aws/aws-sdk-go-v2/service/s3`, a `/vN` suffix aside), or the dependency's ecosystem or language (`go`, `python`).
 *
 * @param tagged the package the tag names
 * @param dependency the dependency followed
 */
export function namesDependency(
  tagged: string,
  dependency: Pick<Dependency, 'ecosystem' | 'name'>,
): boolean {
  const wanted = normalOf(tagged.replace(/\/v\d+$/, ''))
  const name = dependency.name.replace(/\/v\d+$/, '')
  const candidates = [name, name.split('/').pop() ?? name, name.split(':').pop() ?? name]

  return (
    candidates.some(candidate => normalOf(candidate) === wanted) ||
    (wanted.includes('/') && normalOf(name).endsWith(`/${wanted}`)) ||
    (Object.hasOwn(ECOSYSTEM_ALIASES, wanted) && ECOSYSTEM_ALIASES[wanted] === dependency.ecosystem)
  )
}
