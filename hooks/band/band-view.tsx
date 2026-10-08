/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement, RenderNode } from 'claude-code'

import { BAND_HOTKEYS } from '../names/band-hotkeys.js'
import { iconGapOf } from './icon-gap-of.js'
import { actionRowView } from './action-row-view.js'
import type { BandHandlers } from './band-handlers.js'
import type { BandModel } from './band-model.js'
import type { BandRow } from './band-row.js'
import type { BandUi } from './band-ui.js'
import { SUMMARY_INDENT } from './summary-indent.js'
import { SUMMARY_PLACEHOLDER } from './summary-placeholder.js'

/**
 * One item: the selection mark and the headline, the source name dim at the right end (a release row has its glyph before the headline instead), then the summary dim beneath, or an empty line for an item without one (no text, or replies rejected for now) so the band keeps its height as it turns.
 *
 * @param ui the elements
 * @param row the item as drawn
 */
function rowView(ui: BandUi, row: BandRow): RenderElement {
  const { Box, Text, Link } = ui

  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">
        <Text color={row.isSelected ? 'suggestion' : 'inactive'}>{row.isSelected ? '›' : ' '}</Text>{' '}
        {row.icon === undefined
          ? []
          : [<Text color="claude">{row.icon}</Text>, iconGapOf(row.icon)]}
        <Text bold={row.isSelected}>
          {row.href === undefined ? row.title : <Link href={row.href}>{row.title}</Link>}
        </Text>
        {row.source === undefined ? [] : [row.sourceGap, <Text dimColor>{row.source}</Text>]}
      </Text>
      {row.hasNoSummary === true ? (
        <Box height={1} />
      ) : (
        <Box paddingLeft={SUMMARY_INDENT}>
          <Text dimColor wrap="truncate-end">
            {row.summary ?? SUMMARY_PLACEHOLDER}
          </Text>
        </Box>
      )}
    </Box>
  )
}

/**
 * The band: the header (back, position, on, auto, selection up and down), the page's items, the selected item's actions, then what the mods below drew.
 *
 * @param ui the elements
 * @param model what to draw
 * @param handlers what each Button runs
 * @param below the result of `next(e)`, kept so other mods' band content stays
 */
export function bandView(
  ui: BandUi,
  model: BandModel,
  handlers: BandHandlers,
  below: RenderNode,
): RenderElement {
  const { Box, Text, Button } = ui

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        <Button key="prev" label="◀" hotkey={BAND_HOTKEYS.prev} plain onPress={handlers.prev} />
        <Text>{model.range}</Text>
        <Button key="next" label="▶" hotkey={BAND_HOTKEYS.next} plain onPress={handlers.next} />
        <Button
          key="auto"
          label={model.isPaused ? '▶ auto' : '⏸ auto'}
          hotkey={BAND_HOTKEYS.auto}
          plain
          onPress={handlers.auto}
        />
        <Button key="up" label="↑" hotkey={BAND_HOTKEYS.up} plain dimColor onPress={handlers.up} />
        <Button
          key="down"
          label="↓"
          hotkey={BAND_HOTKEYS.down}
          plain
          dimColor
          onPress={handlers.down}
        />
      </Box>
      {model.rows.map(row => rowView(ui, row))}
      {actionRowView(ui, model.isSelectedSaved, handlers)}
      {below}
    </Box>
  )
}
