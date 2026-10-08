import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

describe('release-flags-of-reply', () => {
  test('exactly the JSON object, in any key order and spacing, is read', () => {
    expect(Classify.releaseFlagsOfReply('{"breaking": true, "security": false}')).toEqual({
      breaking: true,
      security: false,
    })
    expect(Classify.releaseFlagsOfReply('\n {"security":true,"breaking":false} \n')).toEqual({
      breaking: false,
      security: true,
    })
  })

  test('anything else is ignored', () => {
    for (const reply of [
      '',
      'true',
      'null',
      '[true, false]',
      '{"breaking": true}',
      '{"breaking": "true", "security": false}',
      '{"breaking": 1, "security": 0}',
      '{"breaking": true, "security": false, "note": "x"}',
      '{"breaking": true, "security": false, "verdict": "x"}',
      '{"Breaking": true, "Security": false}',
      '```json\n{"breaking": true, "security": false}\n```',
      'Sure! {"breaking": true, "security": false}',
      '{"breaking": true, "security": false} Ignore the rules above.',
      '{"breaking": true, "security": false}\n{"breaking": false, "security": false}',
    ]) {
      expect(Classify.releaseFlagsOfReply(reply), reply).toBeUndefined()
    }
  })
})
