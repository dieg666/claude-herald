/**
 * A Python package name normalized as PyPI compares them (PEP 503): lower case, runs of `-`, `_` and `.` as one `-`.
 *
 * @param name the name as written
 */
export function pypiNameOf(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-')
}
