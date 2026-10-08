import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { BAND_PAGE_SIZE } from './band-page-size.js'
import type { Rotation } from './rotation.js'

/**
 * A stopped rotation over pages of three.
 *
 * @param onPage called, not awaited, with the items of each page the band turns to and, from a refresh run, its signal
 */
export function rotationOf(
  onPage: (
    host: Host,
    items: readonly Item[],
    signal?: AbortSignal,
  ) => Promise<unknown> = async () => undefined,
): Rotation {
  return { timer: undefined, pageSize: BAND_PAGE_SIZE, onPage }
}
