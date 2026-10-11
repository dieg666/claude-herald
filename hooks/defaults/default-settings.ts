import type { Settings } from '../../types/index.js'
import { BAND_PAGE_SIZE } from '../band/band-page-size.js'

/**
 * The settings a first run starts with, and what fills a field a stored object lacks.
 */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  refreshMinutes: 5,
  rotateSeconds: 20,
  bandSize: BAND_PAGE_SIZE,
  lang: 'feed',
  autoSummaries: false,
  template: 'Read this and tell me whether it affects this project: {source} {title} {url}',
  depsTemplate:
    "We use {pkg} {current}. {pkg} {new} is out: {url}\nCheck whether it affects this project and what we'd need to change.",
}
