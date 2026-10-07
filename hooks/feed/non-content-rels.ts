/** Atom link relations that never point at the entry's page, so they are never its link. */
export const NON_CONTENT_RELS: ReadonlySet<string> = new Set([
  'self',
  'enclosure',
  'replies',
  'edit',
  'edit-media',
  'via',
])
