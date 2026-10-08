import { stackItemAt } from './stack-item-at.js'

/**
 * Several releases of a few packages, newest first: zod four (a 3.25.0 backport dated after its 4.6.5 target, a breaking 4.6.3 in the middle and an older 4.6.1), vite two minors and ky one major.
 */
export const STACK_MIDDLE = [
  stackItemAt('zod', '3.25.0', { current: '3.23.8', publishedAt: '2026-09-20T00:00:00Z' }),
  stackItemAt('vite', '5.2.0', { current: '5.0.0', publishedAt: '2026-09-18T00:00:00Z' }),
  stackItemAt('zod', '4.6.5', {
    current: '3.23.8',
    level: 'major',
    publishedAt: '2026-09-13T00:00:00Z',
  }),
  stackItemAt('zod', '4.6.3', {
    current: '3.23.8',
    level: 'major',
    breaking: true,
    title: 'Zod 4.6.3',
    publishedAt: '2026-09-12T00:00:00Z',
  }),
  stackItemAt('vite', '5.1.0', { current: '5.0.0', publishedAt: '2026-09-10T00:00:00Z' }),
  stackItemAt('ky', '1.0.0', {
    current: '0.9.0',
    level: 'major',
    publishedAt: '2026-09-07T00:00:00Z',
  }),
  stackItemAt('zod', '4.6.1', {
    current: '3.23.8',
    level: 'major',
    publishedAt: '2026-09-01T00:00:00Z',
  }),
]
