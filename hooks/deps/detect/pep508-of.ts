/**
 * One requirement as PEP 508 writes it, environment marker and extras dropped.
 */
type Requirement = { name: string; range?: string; source?: string }

/**
 * Reads a PEP 508 requirement such as `pydantic[email]>=2,<3; python_version>"3.8"` or `pkg @ https://...`; undefined when it names no package.
 *
 * @param text the requirement
 */
export function pep508Of(text: string): Requirement | undefined {
  const match = /^\s*([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)\s*(?:\[[^\]]*\])?\s*(.*)$/.exec(
    text,
  )

  if (match === null) {
    return undefined
  }

  const name = match[1] ?? ''
  const rest = (match[2] ?? '').trim()

  if (rest.startsWith('@')) {
    return {
      name,
      source:
        rest
          .slice(1)
          .split(/\s+;|;\s/)[0]
          ?.trim() ?? '',
    }
  }

  const range = (rest.split(';')[0] ?? '')
    .trim()
    .replace(/^\((.*)\)$/, '$1')
    .replace(/\s+/g, '')

  return range === '' ? { name } : { name, range }
}
