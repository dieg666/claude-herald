import type { ElementTable } from 'claude-code'

/**
 * The elements the band draws with, from the table `$.ui.resolve(e)` hands the render hook; every surface carries them.
 */
export type BandUi = Pick<ElementTable, 'Box' | 'Text' | 'Button' | 'Link'>
