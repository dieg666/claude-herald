/**
 * Where a qualifier word puts a version relative to its final release: dev builds lowest, then alpha, beta, milestone, release candidate, snapshot, and post releases or service packs above it.
 */
export const QUALIFIER_RANKS: Readonly<Record<string, number>> = {
  dev: -6,
  alpha: -5,
  a: -5,
  beta: -4,
  b: -4,
  milestone: -3,
  m: -3,
  rc: -2,
  cr: -2,
  c: -2,
  pre: -2,
  preview: -2,
  snapshot: -1,
  post: 1,
  rev: 1,
  r: 1,
  sp: 1,
  p: 1,
  pl: 1,
  patch: 1,
}
