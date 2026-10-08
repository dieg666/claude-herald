/**
 * What changes the band: a page turn back or on (both pause), the timer's turn, the auto toggle, or the selection moving up or down (which pauses).
 */
export type BandMove = 'prev' | 'next' | 'rotate' | 'auto' | 'up' | 'down'
