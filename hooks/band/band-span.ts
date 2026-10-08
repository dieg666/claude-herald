/**
 * The part of the list the band shows: where the page starts, how many items it holds, and which of them is selected.
 */
export type BandSpan = {
  readonly start: number
  readonly count: number
  readonly selected: number
}
