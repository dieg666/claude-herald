import type { On, PaneOpenArgs, RenderSurface, UiOpenResult } from 'claude-code'

/**
 * Answers `$.session.surfaces` with those surfaces and `$.ui.open` with that result, recording each pane opened.
 *
 * @param on the test's registrar
 * @param surfaces the surfaces attached to the session
 * @param result what opening a pane answers
 */
export function paneOn(
  on: On,
  surfaces: readonly RenderSurface[],
  result: UiOpenResult = { isPlaced: true },
): PaneOpenArgs[] {
  const opened: PaneOpenArgs[] = []

  on('session.surfaces', () => ({ value: surfaces }))
  on('ui.open', ($, e) => {
    opened.push(e)

    return { value: result }
  })

  return opened
}
