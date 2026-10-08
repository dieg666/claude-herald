import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'

describe('is-meta-reply', () => {
  test('replies seen describing the item or its title are caught', () => {
    for (const reply of [
      'Anthropic has announced Claude Sonnet 5.5, its newest model in the Sonnet line, according to the title alone.',
      "Anthropic expands its program, according to the item's title.",
      'A post whose title is its only available text announces a new model.',
      'Anthropic announces a new model, judging from the title alone.',
      'Based on the title, Anthropic released a new SDK.',
      'This item announces a release.',
      "The item's title names a new model.",
      'A new model ships; no further details are given.',
      'The text gives no details beyond the headline.',
      'Nothing more is said in the text.',
      'A release is announced, but nothing else is in the text.',
    ]) {
      expect([reply, Summaries.isMetaReply(reply)]).toEqual([reply, true])
    }
  })

  test('replies that show reasoning are caught', () => {
    for (const reply of [
      'Anthropic announces an expansion of its Cyber Verification Program, a vetting process. Wait, the item giv',
      'Hmm, the title says little. Anthropic ships a model.',
      'Let me summarize: a new SDK version is out.',
      'A new SDK ships. Let me check the details.',
    ]) {
      expect([reply, Summaries.isMetaReply(reply)]).toEqual([reply, true])
    }
  })

  test('summaries about the story itself pass', () => {
    for (const reply of [
      'Security researchers get wider access to models through a vetted program.',
      'Zed rewrites the text editor renderer on the GPU, cutting input latency in half.',
      'The textbook on compilers gets a free second edition.',
      'A waitlist opens for the new API, with access rolling out over the month.',
      'Let’s Encrypt shortens certificate lifetimes to 45 days.',
      'Hacker News readers debate the new item ranking and its effect on old posts.',
      'Users can now let mentors review pull requests before merge.',
    ]) {
      expect([reply, Summaries.isMetaReply(reply)]).toEqual([reply, false])
    }
  })
})
