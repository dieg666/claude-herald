/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement } from 'claude-code'

import { actionRowView } from '../band/action-row-view.js'
import type { BandUi } from '../band/band-ui.js'
import { SUMMARY_INDENT } from '../band/summary-indent.js'
import { SUMMARY_PLACEHOLDER } from '../band/summary-placeholder.js'
import { PANE_HOTKEYS } from '../names/pane-hotkeys.js'
import type { PaneHandlers } from './pane-handlers.js'
import type { PaneModel } from './pane-model.js'
import type { PaneRow } from './pane-row.js'

/**
 * One item: the selection mark, the source glyph, the headline and its date, then the summary dim beneath.
 *
 * @param ui the elements
 * @param row the item as drawn
 */
function rowView(ui: BandUi, row: PaneRow): RenderElement {
  const { Box, Text, Link } = ui

  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">
        <Text color={row.isSelected ? 'suggestion' : 'inactive'}>{row.isSelected ? '›' : ' '}</Text>{' '}
        <Text color="claude">{row.icon}</Text>{' '}
        <Text bold={row.isSelected}>
          {row.href === undefined ? row.title : <Link href={row.href}>{row.title}</Link>}
        </Text>
        {row.date === undefined ? [] : [' ', <Text dimColor>{row.date}</Text>]}
      </Text>
      <Box paddingLeft={SUMMARY_INDENT}>
        <Text dimColor wrap="truncate-end">
          {row.summary ?? SUMMARY_PLACEHOLDER}
        </Text>
      </Box>
    </Box>
  )
}

/**
 * The pane: the tab row (the active tab undimmed), the heading with the selection Buttons, the window of items or what an empty tab says, then the selected item's actions, with mark-as-read on the saved tab.
 *
 * @param ui the elements
 * @param model what to draw
 * @param handlers what each Button runs
 */
export function paneView(ui: BandUi, model: PaneModel, handlers: PaneHandlers): RenderElement {
  const { Box, Text, Button } = ui

  const read = model.isSavedTab
    ? [
        <Button
          key="read"
          label="Mark as read"
          hotkey={PANE_HOTKEYS.read}
          plain
          onPress={handlers.read}
        />,
      ]
    : []

  const body =
    model.rows.length === 0
      ? [<Text dimColor>{model.empty}</Text>]
      : [
          ...model.rows.map(row => rowView(ui, row)),
          actionRowView(ui, model.isSelectedSaved, handlers, read),
        ]

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {model.tabs.map(tab => (
          <Button
            key={`tab-${tab.id}`}
            label={tab.label}
            {...(tab.hotkey === undefined ? {} : { hotkey: tab.hotkey })}
            plain
            dimColor={!tab.isActive}
            onPress={handlers.tab(tab.id)}
          />
        ))}
      </Box>
      <Box flexDirection="row" columnGap={2}>
        <Text color="suggestion" wrap="truncate-end">
          {model.heading}
        </Text>
        <Button key="up" label="↑" hotkey={PANE_HOTKEYS.up} plain dimColor onPress={handlers.up} />
        <Button
          key="down"
          label="↓"
          hotkey={PANE_HOTKEYS.down}
          plain
          dimColor
          onPress={handlers.down}
        />
      </Box>
      {body}
    </Box>
  )
}
