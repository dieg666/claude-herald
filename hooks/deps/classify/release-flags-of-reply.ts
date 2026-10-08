import type { ReleaseFlags } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'

/**
 * The flags a model reply gives when it is exactly the JSON object `{"breaking": <boolean>, "security": <boolean>}`, surrounding whitespace aside; undefined for anything else (other keys, other types, fences, prose).
 *
 * @param text the model's reply
 */
export function releaseFlagsOfReply(text: string): ReleaseFlags | undefined {
  let value: unknown

  try {
    value = JSON.parse(text.trim())
  } catch {
    return undefined
  }

  if (!isRecord(value)) {
    return undefined
  }

  const keys = Object.keys(value).sort()

  if (keys.length !== 2 || keys[0] !== 'breaking' || keys[1] !== 'security') {
    return undefined
  }

  const { breaking, security } = value

  return typeof breaking === 'boolean' && typeof security === 'boolean'
    ? { breaking, security }
    : undefined
}
