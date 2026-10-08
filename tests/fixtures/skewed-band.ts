import { datedItemsOf } from './dated-items-of.js'
import { sourceAt } from './source-at.js'
import { stackItemAt } from './stack-item-at.js'

/**
 * A band skewed like a real store: 20 Hacker News items an hour apart from 2026-01-02, two of `anthropic` (4 and 5 hours before), two of `sdk` (1 and 2), one of `willison` (12) and two stack releases (2.5 and 16).
 */
export const SKEWED_BAND = {
  sources: [
    sourceAt('hn', { name: 'Hacker News' }),
    sourceAt('anthropic', { name: 'Anthropic' }),
    sourceAt('sdk', { name: 'Agent SDK' }),
    sourceAt('willison', { name: 'Willison' }),
  ],
  items: {
    hn: datedItemsOf('hn', 20),
    anthropic: datedItemsOf('anthropic', 2, 4),
    sdk: datedItemsOf('sdk', 2, 1),
    willison: datedItemsOf('willison', 1, 12),
  },
  stack: [
    stackItemAt('vite', '5.1.0', { current: '5.0.0', publishedAt: '2026-01-01T21:30:00Z' }),
    stackItemAt('react', '19.1.0', { current: '19.0.0', publishedAt: '2026-01-01T08:00:00Z' }),
  ],
}
