import type { On, RenderSurface, UiOpenResult, UiPane } from 'claude-code'

/**
 * Keeps the engine's record of the mod's panes as the engine does: `$.session.surfaces` answers those surfaces, `$.ui.open` adds the pane (shown and focused, placed as `result` says) or retitles it, `$.ui.close` removes it, and `$.ui.panes` lists them; the list is returned for a test to change.
 *
 * @param on the test's registrar
 * @param surfaces the surfaces attached to the session
 * @param result what opening a pane answers
 */
export function panesOn(
  on: On,
  surfaces: readonly RenderSurface[],
  result: UiOpenResult = { isPlaced: true },
): UiPane[] {
  const panes: UiPane[] = []

  on('session.surfaces', () => ({ value: surfaces }))
  on('ui.open', ($, e) => {
    const pane = {
      id: e.id,
      title: e.title ?? e.id,
      isShown: true,
      isFocused: e.focus === true,
      isPlaced: result.isPlaced,
    }
    const index = panes.findIndex(open => open.id === e.id)

    panes.splice(index === -1 ? panes.length : index, 1, pane)

    return { value: result }
  })
  on('ui.close', ($, e) => {
    const index = panes.findIndex(open => open.id === e.id)

    if (index !== -1) {
      panes.splice(index, 1)
    }

    return { value: undefined }
  })
  on('ui.panes', () => ({ value: panes.map(pane => ({ ...pane })) }))

  return panes
}
