import { serialOf } from '../../refresh/serial-of.js'
import type { StackLoop } from './stack-loop.js'

/**
 * A stack loop before the start detection.
 */
export function stackLoopOf(): StackLoop {
  return {
    isStarted: false,
    root: undefined,
    running: undefined,
    isPending: false,
    failedAt: new Map(),
    serially: serialOf(),
  }
}
