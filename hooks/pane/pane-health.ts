/**
 * What the pane's state lines read about the refresh: the last failure and the last clean refresh of each source, whether a run is in flight, the interval and the clock; a mover that needs only which tabs draw a state line passes the failures alone.
 */
export type PaneHealth = {
  /** The last refresh failure by source id. */
  readonly errors: Readonly<Record<string, string>>
  /** When each source last refreshed cleanly, in milliseconds since the epoch, by source id. */
  readonly refreshedAt?: Readonly<Record<string, number>>
  /** Whether a refresh run is in flight. */
  readonly isRefreshing?: boolean
  /** Minutes between refreshes. */
  readonly refreshMinutes?: number
  /** The clock, in milliseconds since the epoch; without it a failure says no time. */
  readonly now?: number
}
