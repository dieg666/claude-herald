import { stackItemAt } from './stack-item-at.js'

/**
 * Several releases of a few packages, newest first: astro one major, @astrojs/node one security major, jsdom three majors (30.0.0 breaking), a scoped Font Awesome package two minors, lodash a patch, left-pad an `unknown` one and PyPI's requests a security patch.
 */
export const STACK_RELEASES = [
  stackItemAt('left-pad', 'canary', {
    current: '1.0.0',
    level: 'unknown',
    title: 'canary',
    publishedAt: '2026-10-08T00:00:00Z',
  }),
  stackItemAt('astro', '7.3.7', {
    current: '5.18.1',
    level: 'major',
    publishedAt: '2026-10-07T00:00:00Z',
  }),
  stackItemAt('@astrojs/node', '11.1.7', {
    current: '9.5.5',
    level: 'major',
    security: true,
    publishedAt: '2026-10-06T00:00:00Z',
  }),
  stackItemAt('jsdom', '30.1.2', {
    current: '25.0.1',
    level: 'major',
    publishedAt: '2026-10-05T00:00:00Z',
  }),
  stackItemAt('jsdom', '30.1.1', {
    current: '25.0.1',
    level: 'major',
    publishedAt: '2026-09-22T00:00:00Z',
  }),
  stackItemAt('jsdom', '30.0.0', {
    current: '25.0.1',
    level: 'major',
    breaking: true,
    title: 'jsdom 30',
    publishedAt: '2026-09-01T00:00:00Z',
  }),
  stackItemAt('@fortawesome/fontawesome-svg-core', '7.3.1', {
    current: '7.1.0',
    publishedAt: '2026-07-15T00:00:00Z',
  }),
  stackItemAt('@fortawesome/fontawesome-svg-core', '7.2.0', {
    current: '7.1.0',
    publishedAt: '2026-06-01T00:00:00Z',
  }),
  stackItemAt('lodash', '4.17.21', {
    current: '4.17.20',
    level: 'patch',
    publishedAt: '2026-05-01T00:00:00Z',
  }),
  stackItemAt('requests', '2.31.1', {
    ecosystem: 'pypi',
    current: '2.31.0',
    level: 'patch',
    security: true,
    publishedAt: '2026-04-01T00:00:00Z',
  }),
]
