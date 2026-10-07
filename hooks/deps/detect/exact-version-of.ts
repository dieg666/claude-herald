/**
 * The version a requirement pins when it names exactly one (`1.2.3`, `=1.2.3`, `==1.2.3`, `v1.2.3`), else undefined.
 *
 * @param requirement the requirement as written
 */
export function exactVersionOf(requirement: string | undefined): string | undefined {
  const match = /^\s*(?:={1,3}\s*)?(v?\d+(?:\.\d+)*(?:[-+.][0-9A-Za-z.+-]+)?)\s*$/.exec(
    requirement ?? '',
  )
  const version = match?.[1]

  return version === undefined || /(?:^|\.)[xX*](?:\.|$)/.test(version) ? undefined : version
}
