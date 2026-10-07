/**
 * A version that can go in a registry URL as is (`1.2.3`, `2.0.0-rc.1`, `5.3.31.RELEASE`), else undefined; ranges and placeholders are not.
 *
 * @param version the version in use, when known
 */
export function plainVersionOf(version: string | undefined): string | undefined {
  const text = version?.trim() ?? ''

  return /^\d[\w.+-]*$/.test(text) ? text : undefined
}
