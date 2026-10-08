import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'

describe('default-settings', () => {
  test('refresh every 5 minutes, rotate every 20 s, feed language, automatic summaries off, the copy templates', () => {
    expect(Defaults.DEFAULT_SETTINGS).toEqual({
      refreshMinutes: 5,
      rotateSeconds: 20,
      lang: 'feed',
      autoSummaries: false,
      template: 'Read this and tell me whether it affects this project: {source} {title} {url}',
      depsTemplate:
        "We use {pkg} {current}. {pkg} {new} is out: {url}\nCheck whether it affects this project and what we'd need to change.",
    })
  })
})
