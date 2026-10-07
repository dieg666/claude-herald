import type { Settings } from '../../types/index.js'

/**
 * The settings a first run starts with, and what fills a field a stored object lacks.
 */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  refreshMinutes: 5,
  rotateSeconds: 20,
  lang: 'feed',
  template: 'Read this and tell me whether it affects this project: {title} {url}',
}
