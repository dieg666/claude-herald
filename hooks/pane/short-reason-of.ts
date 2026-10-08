import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { cutTo } from '../page/cut-to.js'

/**
 * The most characters a failure's reason keeps on a state line.
 */
const REASON_CHARS = 60

/**
 * A refresh failure's reason as one short line, without the engine's `<plugin>: $.<namespace>.<method>(<argument>) failed: ` prefixes and with a code it repeats said once, `…` marking a cut.
 *
 * @param reason the reason recorded
 */
export function shortReasonOf(reason: string): string {
  const line = collapsedTextOf(reason)
    .replace(/[\w-]+: \$\.\w+\.\w+(?:\([^)]*\))?(?: failed)?: /g, '')
    .replace(/\b([\w-]+: )\1+/g, '$1')
    .trim()

  return line.length > REASON_CHARS ? `${cutTo(line, REASON_CHARS - 1).trimEnd()}…` : line
}
