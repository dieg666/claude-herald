import { SKEWED_BAND } from './skewed-band.js'
import { stackItemAt } from './stack-item-at.js'

/**
 * `SKEWED_BAND`'s sources and items with four stack releases, newest first: an unflagged one newer than every news item (half an hour after 2026-01-02), another unflagged one, then a security patch (PyPI) and a breaking major older than every news item.
 */
export const FLAGGED_BAND = {
  sources: SKEWED_BAND.sources,
  items: SKEWED_BAND.items,
  stack: [
    stackItemAt('vite', '5.1.0', { current: '5.0.0', publishedAt: '2026-01-02T00:30:00Z' }),
    stackItemAt('react', '19.1.0', { current: '19.0.0', publishedAt: '2026-01-01T08:00:00Z' }),
    stackItemAt('requests', '2.31.1', {
      ecosystem: 'pypi',
      current: '2.31.0',
      level: 'patch',
      security: true,
      publishedAt: '2025-12-30T00:00:00Z',
    }),
    stackItemAt('jsdom', '30.1.2', {
      current: '25.0.1',
      level: 'major',
      breaking: true,
      publishedAt: '2025-12-20T00:00:00Z',
    }),
  ],
}
