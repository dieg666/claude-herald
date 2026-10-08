/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement, RenderNode } from 'claude-code'

import { BAND_HOTKEYS } from '../names/band-hotkeys.js'
import { BAND_LABELS } from '../names/band-labels.js'
import { BAND_NAME } from '../names/band-name.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'
import { iconGapOf } from './icon-gap-of.js'
import { actionRowView } from './action-row-view.js'
import type { BandHandlers } from './band-handlers.js'
import type { BandModel } from './band-model.js'
import type { BandRow } from './band-row.js'
import type { BandUi } from './band-ui.js'
import { LEAD_COLUMNS } from './lead-columns.js'
import { SUMMARY_PLACEHOLDER } from './summary-placeholder.js'

/**
 * One item: the selection mark, the source column (a news item's source name, dim, or in the release color for a release; a release of the stack's glyph and package), the headline, then the summary dim beneath it, starting in the headline's column, or an empty line for an item without one (no text, or replies rejected for now) so the band keeps its height as it turns.
 *
 * @param ui the elements
 * @param row the item as drawn
 */
function rowView(ui: BandUi, row: BandRow): RenderElement {
  const { Box, Text, Link } = ui
  const label =
    row.source === ''
      ? []
      : [
          row.isRelease === true ? (
            <Text color="claude">{row.source}</Text>
          ) : (
            <Text dimColor>{row.source}</Text>
          ),
        ]

  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">
        <Text color={row.isSelected ? 'suggestion' : 'inactive'}>{row.isSelected ? '›' : ' '}</Text>{' '}
        {row.icon === undefined
          ? []
          : [<Text color="claude">{row.icon}</Text>, iconGapOf(row.icon)]}
        {label}
        {row.sourceGap}
        <Text bold={row.isSelected}>
          {row.href === undefined ? row.title : <Link href={row.href}>{row.title}</Link>}
        </Text>
      </Text>
      {row.hasNoSummary === true ? (
        <Box height={1} />
      ) : (
        <Box paddingLeft={LEAD_COLUMNS}>
          <Text dimColor wrap="truncate-end">
            {row.summary ?? SUMMARY_PLACEHOLDER}
          </Text>
        </Box>
      )}
    </Box>
  )
}

/**
 * The full band: the header (its name, the position, back, next, auto), the page's items, the selected item's actions followed by the selection buttons, then what the mods below drew; drawn only where the header and the actions line fit on one row at their widest (narrower, the band is compact), so its rows depend on the item count only.
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
  const pages = (
    <Box flexDirection="row" columnGap={GROUP_GAP_COLUMNS} marginLeft={GROUP_GAP_COLUMNS}>
      <Button
        key="prev"
        label={BAND_LABELS.prev}
        hotkey={BAND_HOTKEYS.prev}
        plain
        onPress={handlers.prev}
      />
      <Button
        key="next"
        label={BAND_LABELS.next}
        hotkey={BAND_HOTKEYS.next}
        plain
        onPress={handlers.next}
      />
      <Button
        key="auto"
        label={model.isPaused ? BAND_LABELS.autoPaused : BAND_LABELS.autoRunning}
        hotkey={BAND_HOTKEYS.auto}
        plain
        onPress={handlers.auto}
      />
    </Box>
  )
  const title = [<Text bold>{BAND_NAME}</Text>, <Text>{model.range}</Text>]
  const selection = (
    <Box flexDirection="row" columnGap={GROUP_GAP_COLUMNS} marginLeft={GROUP_GAP_COLUMNS}>
      <Button
        key="up"
        label={BAND_LABELS.up}
        hotkey={BAND_HOTKEYS.up}
        plain
        dimColor
        onPress={handlers.up}
      />
      <Button
        key="down"
        label={BAND_LABELS.down}
        hotkey={BAND_HOTKEYS.down}
        plain
        dimColor
        onPress={handlers.down}
      />
    </Box>
  )

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" columnGap={GROUP_GAP_COLUMNS}>
        {title}
        {pages}
      </Box>
      {model.rows.map(row => rowView(ui, row))}
      {actionRowView(ui, model.isSelectedSaved, handlers, [selection])}
      {below}
    </Box>
  )
}
