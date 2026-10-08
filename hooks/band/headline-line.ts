/**
 * A headline and, when there is room, its source's name at the right end: the name is dim, `sourceGap` spaces after the headline so it ends at the last cell.
 */
export type HeadlineLine = {
  readonly title: string
  readonly source?: string
  readonly sourceGap?: string
}
