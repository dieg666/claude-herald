import type { ReleaseFlags } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'

/** One opening fence line (with an optional language) and one closing fence around the whole reply. */
const FENCED = /^```[\w-]*[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```$/

/**
 * The flags a model reply gives when it is exactly the JSON object `{"breaking": <boolean>, "security": <boolean>}`, surrounding whitespace and one code fence around it aside; undefined for anything else (other keys, other types, prose).
 *
 * @param text the model's reply
 */
export function releaseFlagsOfReply(text: string): ReleaseFlags | undefined {
  const trimmed = text.trim()
  let value: unknown

  try {
    value = JSON.parse(FENCED.exec(trimmed)?.[1] ?? trimmed)
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
