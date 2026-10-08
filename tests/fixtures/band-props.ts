import type { RenderPropsOf } from 'claude-code'

/**
 * What the engine hands the band's render hook: no survey, idle, 80 cells across, room to show everything.
 */
export const BAND_PROPS: RenderPropsOf['AbovePrompt'] = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 40,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 39 },
  view: {},
}
