/* @jsxRuntime classic */
/* @jsx h */
/* @jsxFrag Fragment */
import type { RenderElement, RenderNode } from 'claude-code'

import { BAND_HOTKEYS } from '../names/band-hotkeys.js'
import { BAND_LABELS } from '../names/band-labels.js'
import { BAND_NAME } from '../names/band-name.js'
import type { BandHandlers } from './band-handlers.js'
import type { BandUi } from './band-ui.js'
import type { CompactBandModel } from './compact-band-model.js'
import { COMPACT_GAP_COLUMNS } from './compact-gap-columns.js'
import { GROUP_GAP_COLUMNS } from './group-gap-columns.js'
import { iconGapOf } from './icon-gap-of.js'
import { SOURCE_GAP_COLUMNS } from './source-gap-columns.js'

/**
 * The compact band: `Herald 13/156`, the back, next and auto Buttons, then the one item's source name when the model has room for it (dim, or in the release color for a release) and its headline in bold (a link when it has an address), followed by what the mods below drew; on as many rows as the model says, so its height depends on the width and the total only.
 *
 * @param ui the elements
 * @param model what to draw
 * @param handlers what the back, next and auto Buttons run
 * @param below the result of `next(e)`, kept so other mods' band content stays
 */
export function compactBandView(
  ui: BandUi,
  model: CompactBandModel,
  handlers: Pick<BandHandlers, 'prev' | 'next' | 'auto'>,
  below: RenderNode,
): RenderElement {
  const { Box, Text, Button, Link } = ui
  const { headline } = model
  const title = (
    <Box flexDirection="row" columnGap={COMPACT_GAP_COLUMNS}>
      <Text bold>{BAND_NAME}</Text>
      <Text>{model.position}</Text>
    </Box>
  )
  const buttons = (
    <Box flexDirection="row" columnGap={GROUP_GAP_COLUMNS}>
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
  const line = (
    <Text wrap="truncate-end">
      {headline.icon === undefined
        ? []
        : [<Text color="claude">{headline.icon}</Text>, iconGapOf(headline.icon)]}
      {headline.source === undefined
        ? []
        : [
            headline.isRelease === true ? (
              <Text color="claude">{headline.source}</Text>
            ) : (
              <Text dimColor>{headline.source}</Text>
            ),
            ' '.repeat(SOURCE_GAP_COLUMNS),
          ]}
      <Text bold>
        {headline.href === undefined ? (
          headline.title
        ) : (
          <Link href={headline.href}>{headline.title}</Link>
        )}
      </Text>
    </Text>
  )

  return (
    <Box flexDirection="column">
      {model.rowCount === 1 ? (
        <Box flexDirection="row" columnGap={GROUP_GAP_COLUMNS}>
          {title}
          {buttons}
          {line}
        </Box>
      ) : model.rowCount === 2 ? (
        <Box flexDirection="column">
          <Box flexDirection="row" columnGap={GROUP_GAP_COLUMNS}>
            {title}
            {buttons}
          </Box>
          {line}
        </Box>
      ) : (
        <Box flexDirection="column">
          {title}
          {buttons}
          {line}
        </Box>
      )}
      {below}
    </Box>
  )
}
