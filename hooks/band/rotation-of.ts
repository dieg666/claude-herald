import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import type { Rotation } from './rotation.js'

/**
 * A stopped rotation.
 *
 * @param onPage called, not awaited, with the items of each page the band turns to
 */
export function rotationOf(
  onPage: (host: Host, items: readonly Item[]) => Promise<unknown> = async () => undefined,
): Rotation {
  return { timer: undefined, onPage }
}
