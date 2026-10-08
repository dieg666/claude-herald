import type { StackItem, StackRelease } from '../../types/index.js'

/**
 * A stack item of an npm package's release, titled `v<version>`, a minor release unless told otherwise, dated when given an ISO date.
 *
 * @param name the package
 * @param version the release's version
 * @param fields what differs: the release's fields, its date or title
 */
export function stackItemAt(
  name: string,
  version: string,
  fields: Partial<StackRelease> & { publishedAt?: string; title?: string } = {},
): StackItem {
  const { publishedAt, title, ...release } = fields
  const ecosystem = release.ecosystem ?? 'npm'
  const releaseId = `${ecosystem}:${name}|tag:github.com,2008:Repository/1/v${version}`

  return {
    id: `@stack:${releaseId}`,
    sourceId: '@stack',
    title: title ?? `v${version}`,
    url: `https://github.com/owner/${name}/releases/tag/v${version}`,
    ...(publishedAt === undefined ? {} : { publishedAt }),
    text: `Notes of ${name} ${version}.`,
    release: {
      releaseId,
      ecosystem,
      name,
      version,
      level: 'minor',
      isPrerelease: false,
      breaking: false,
      security: false,
      ...release,
    },
  }
}
