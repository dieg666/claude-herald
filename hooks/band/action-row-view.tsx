/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code'

import type { ItemActionHandlers } from '../actions/item-action-handlers.js'
import { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import { ACTION_LABELS } from '../names/action-labels.js'
import type { BandUi } from './band-ui.js'

/**
 * The selected item's actions (open, summarize, save, copy for Claude), then any Buttons of the view's own; the band and the pane share it. Split, the first three actions take one row and copy then the extra Buttons a second, whatever the width.
 *
 * @param ui the elements
 * @param isSelectedSaved whether the selected item is saved already
 * @param handlers what each action runs
 * @param extra Buttons drawn after the actions
 * @param isSplit whether the line takes two explicit rows instead of wrapping where it must
 */
export function actionRowView(
  ui: BandUi,
  isSelectedSaved: boolean,
  handlers: ItemActionHandlers,
  extra: readonly RenderElement[] = [],
  isSplit = false,
): RenderElement {
  const { Box, Button } = ui
  const first = [
    <Button
      key="open"
      label={ACTION_LABELS.open}
      hotkey={ACTION_HOTKEYS.open}
      plain
      onPress={handlers.open}
    />,
    <Button
      key="summarize"
      label={ACTION_LABELS.summarize}
      hotkey={ACTION_HOTKEYS.summarize}
      plain
      onPress={handlers.summarize}
    />,
    <Button
      key="save"
      label={isSelectedSaved ? ACTION_LABELS.saved : ACTION_LABELS.save}
      hotkey={ACTION_HOTKEYS.save}
      plain
      dimColor={isSelectedSaved}
      onPress={handlers.save}
    />,
  ]
  const copy = (
    <Button
      key="copy"
      label={ACTION_LABELS.copy}
      hotkey={ACTION_HOTKEYS.copy}
      plain
      onPress={handlers.copy}
    />
  )

  return isSplit ? (
    <Box flexDirection="column">
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {first}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {copy}
        {extra}
      </Box>
    </Box>
  ) : (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {first}
      {copy}
      {extra}
    </Box>
  )
}
