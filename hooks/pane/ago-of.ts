/**
 * How long ago a time was, as the pane says it: `just now` under a minute (or for a time ahead of the clock), then `5 min ago`, `2 h ago`, `3 d ago`, rounded down.
 *
 * @param at the time, in milliseconds since the epoch
 * @param now the clock, in milliseconds since the epoch
 */
export function agoOf(at: number, now: number): string {
  const minutes = Math.floor((now - at) / 60_000)

  if (!(minutes >= 1)) {
    return 'just now'
  }

  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)

  return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`
}
