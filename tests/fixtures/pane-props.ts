import type { RenderPropsOf } from 'claude-code'

/**
 * What the engine hands the pane's render hook: focused, docked, 80 cells across, room for many rows.
 */
export const PANE_PROPS: RenderPropsOf['Pane'] = {
  title: 'Herald',
  isFocused: true,
  bodyColumns: 80,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}
