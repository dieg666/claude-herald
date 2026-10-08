import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

describe('tag-of-entry', () => {
  test('the tag comes from a GitHub id, slashes included', () => {
    expect(
      Classify.tagOfEntry({ guid: 'tag:github.com,2008:Repository/590187800/service/s3/v1.40.0' }),
    ).toBe('service/s3/v1.40.0')
  })

  test('else from a release link, percent-decoded', () => {
    expect(
      Classify.tagOfEntry({
        link: 'https://github.com/vitejs/vite/releases/tag/%40vitejs%2Fplugin-react%404.2.0',
      }),
    ).toBe('@vitejs/plugin-react@4.2.0')
    expect(Classify.tagOfEntry({ link: 'https://github.com/o/r/releases/tag/%E0%A4%A' })).toBe(
      '%E0%A4%A',
    )
  })

  test('other feeds have none', () => {
    expect(
      Classify.tagOfEntry({ guid: 'urn:uuid:1', link: 'https://example.com/post' }),
    ).toBeUndefined()
    expect(Classify.tagOfEntry({})).toBeUndefined()
  })
})
