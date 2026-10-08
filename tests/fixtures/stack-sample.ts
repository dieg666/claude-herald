import { stackItemAt } from './stack-item-at.js'

/**
 * One release of each kind, newest first: a breaking major, a minor, a patch, a security patch (PyPI), a major pre-release and a 0.x minor bump (level major).
 */
export const STACK_SAMPLE = [
  stackItemAt('react', '19.0.0', {
    current: '18.2.0',
    level: 'major',
    breaking: true,
    title: 'React 19',
    publishedAt: '2026-01-06T00:00:00Z',
  }),
  stackItemAt('vite', '5.1.0', { current: '5.0.0', publishedAt: '2026-01-05T00:00:00Z' }),
  stackItemAt('lodash', '4.17.21', {
    current: '4.17.20',
    level: 'patch',
    publishedAt: '2026-01-04T00:00:00Z',
  }),
  stackItemAt('requests', '2.31.1', {
    ecosystem: 'pypi',
    current: '2.31.0',
    level: 'patch',
    security: true,
    publishedAt: '2026-01-03T00:00:00Z',
  }),
  stackItemAt('next', '16.0.0-rc.1', {
    current: '15.0.0',
    level: 'major',
    isPrerelease: true,
    publishedAt: '2026-01-02T00:00:00Z',
  }),
  stackItemAt('zod', '0.4.0', {
    current: '0.3.0',
    level: 'major',
    publishedAt: '2026-01-01T00:00:00Z',
  }),
]
