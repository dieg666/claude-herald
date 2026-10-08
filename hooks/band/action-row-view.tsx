/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code'

import type { ItemActionHandlers } from '../actions/item-action-handlers.js'
import { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import type { BandUi } from './band-ui.js'

/**
 * The selected item's actions (open, summarize, save, copy for Claude), then any Buttons of the view's own; the band and the pane share it.
 *
 * @param ui the elements
 * @param isSelectedSaved whether the selected item is saved already
 * @param handlers what each action runs
 * @param extra Buttons drawn after the actions
 */
export function actionRowView(
  ui: BandUi,
  isSelectedSaved: boolean,
  handlers: ItemActionHandlers,
  extra: readonly RenderElement[] = [],
): RenderElement {
  const { Box, Button } = ui

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      <Button key="open" label="Open" hotkey={ACTION_HOTKEYS.open} plain onPress={handlers.open} />
      <Button
        key="summarize"
        label="Summarize"
        hotkey={ACTION_HOTKEYS.summarize}
        plain
        onPress={handlers.summarize}
      />
      <Button
        key="save"
        label={isSelectedSaved ? 'Saved' : 'Save'}
        hotkey={ACTION_HOTKEYS.save}
        plain
        dimColor={isSelectedSaved}
        onPress={handlers.save}
      />
      <Button
        key="copy"
        label="Copy for Claude"
        hotkey={ACTION_HOTKEYS.copy}
        plain
        onPress={handlers.copy}
      />
      {extra}
    </Box>
  )
}
