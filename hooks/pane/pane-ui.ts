import type { ElementConstructor, InputProps } from 'claude-code'

import type { BandUi } from '../band/band-ui.js'

/**
 * The elements the pane draws with: the band's, plus `Input` where the surface's table has one (every surface but mobile).
 */
export type PaneUi = BandUi & {
  readonly Input?: ElementConstructor<InputProps>
}
