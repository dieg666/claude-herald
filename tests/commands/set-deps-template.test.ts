import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('set-deps-template', () => {
  test(
    'saves the text as typed, one enclosing pair of quotes removed, and mirrors it to state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, { settings: { template: 'Mine {url}' } })
      const template = "We use {pkg} {current}; {new} is out: {url} - 'check'"

      expect((await $.command.run(Fixtures.newsOf(`deps template "${template}"`))).text).toBe(
        `Copy for Claude now copies, for a dependency release: ${template}`,
      )
      expect(stored.get('settings')).toEqual({
        ...Defaults.DEFAULT_SETTINGS,
        template: 'Mine {url}',
        depsTemplate: template,
      })
      expect(
        JSON.parse((await $.command.run(Fixtures.PEEK)).text ?? 'null').settings.depsTemplate,
      ).toBe(template)
    },
  )

  test('an unknown placeholder, no {pkg} or {url}, or over 1000 characters is refused with the usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on)
    const usage = '\nUsage: /news deps template <text>'

    expect((await $.command.run(Fixtures.newsOf('deps template {pkg} {title}'))).text).toBe(
      `The template may use {pkg}, {current}, {new}, {url}; {title} is not one of them.${usage}`,
    )
    expect((await $.command.run(Fixtures.newsOf('deps template {new} is out'))).text).toBe(
      `The template must hold {pkg} or {url}.${usage}`,
    )
    expect(
      (await $.command.run(Fixtures.newsOf(`deps template {pkg} ${'x'.repeat(1000)}`))).text,
    ).toBe(`The template is 1006 characters; the most is 1000.${usage}`)
    expect(stored.has('settings')).toBe(false)
  })
})
