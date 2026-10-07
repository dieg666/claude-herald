import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('set-template', () => {
  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { settings: { template: string } }

  test(
    'saves the text as typed, inner spacing kept, and mirrors it to state',
    { plugins: [Fixtures.STATE_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on)
      const template = 'Does  this affect us? {title} ({source}) {url}'

      expect((await $.command.run(Fixtures.newsOf(`template   ${template}  `))).text).toBe(
        `Copy for Claude now copies: ${template}`,
      )
      expect(stored.get('settings')).toMatchObject({ template })
      expect(peeked((await $.command.run(Fixtures.PEEK)).text).settings.template).toBe(template)
    },
  )

  test('one pair of quotes around the whole text is removed', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    await $.command.run(Fixtures.newsOf(`template "Read {url} and say 'why'"`))

    expect(stored.get('settings')).toMatchObject({ template: "Read {url} and say 'why'" })
  })

  test('refuses an unknown placeholder or a text naming no item, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on)

    expect((await $.command.run(Fixtures.newsOf('template {title} {link}'))).text).toBe(
      'The template may use {title}, {url}, {source}; {link} is not one of them.',
    )
    expect((await $.command.run(Fixtures.newsOf('template From {source}'))).text).toBe(
      'The template must hold {title} or {url}, e.g. /news template Does this affect us? {title} {url}',
    )
    expect((await $.command.run(Fixtures.newsOf(`template {url} ${'x'.repeat(1000)}`))).text).toBe(
      'The template is 1006 characters; the most is 1000.',
    )
    expect(stored.has('settings')).toBe(false)
  })

  test('quotes that open and close inside the text are kept', async ($, on) => {
    const stored = Fixtures.storeOn(on)
    const template = '"Read" {title} and "say why"'

    await $.command.run(Fixtures.newsOf(`template ${template}`))

    expect(stored.get('settings')).toMatchObject({ template })
  })
})
