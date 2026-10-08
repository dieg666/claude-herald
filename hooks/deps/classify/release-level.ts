/**
 * How far a release is from the version in use: which release part changed, or `unknown` when either version cannot be compared.
 */
export type ReleaseLevel = 'patch' | 'minor' | 'major' | 'unknown'
