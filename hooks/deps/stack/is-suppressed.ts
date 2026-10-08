import { STACK_LIMITS } from './stack-limits.js'
import type { StackLoop } from './stack-loop.js'

/**
 * Whether something failed inside the failure window, so it is left alone for now.
 *
 * @param loop the loop
 * @param id `lookup:<key>`, `feed:<url>` or `flag:<release id>`
 * @param now the clock
 */
export function isSuppressed(loop: StackLoop, id: string, now: number): boolean {
  const at = loop.failedAt.get(id)

  return at !== undefined && now - at >= 0 && now - at < STACK_LIMITS.failureWindowMs
}
