import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'

describe('default-settings', () => {
  test('refresh every 5 minutes, rotate every 20 s, feed language, the copy template', () => {
    expect(Defaults.DEFAULT_SETTINGS).toEqual({
      refreshMinutes: 5,
      rotateSeconds: 20,
      lang: 'feed',
      template: 'Read this and tell me whether it affects this project: {title} {url}',
    })
  })
})
