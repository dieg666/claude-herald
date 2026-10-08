/** A CVE id (`CVE-2024-3651`) or a GitHub advisory id (`GHSA-jfh8-c2jp-5v3q`). */
const ADVISORY_ID = /\bCVE-\d+-\d+\b|\bGHSA(?:-[0-9a-z]{4}){3}\b/i

/**
 * Whether a release's title and notes name a security advisory by its id.
 *
 * @param text the title and notes
 */
export function hasAdvisoryId(text: string): boolean {
  return ADVISORY_ID.test(text)
}
