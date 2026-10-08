import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'

describe('is-meta-reply', () => {
  test('replies seen describing the item or its title are caught', () => {
    for (const reply of [
      'Anthropic has announced Claude Sonnet 5.5, its newest model in the Sonnet line, according to the title alone.',
      "Anthropic expands its program, according to the item's title.",
      'A post whose title is its only available text announces a new model.',
      'Anthropic announces a new model, judging from the title alone.',
      'Based solely on the title, Anthropic released a new SDK.',
      'This item announces a release.',
      'This article is a short announcement of a model.',
      "The item's title names a new model.",
      'A new model ships; no further details are given.',
      'The text alone does not say when it ships.',
      'A release is announced, with no text beyond the headline.',
    ]) {
      expect([reply, Summaries.isMetaReply(reply)]).toEqual([reply, true])
    }
  })

  test('replies that show reasoning are caught', () => {
    for (const reply of [
      'Anthropic announces an expansion of its Cyber Verification Program, a vetting process … Wait, the item giv',
      'Anthropic announces an expansion of its Cyber Verification Program, a vetting process. Wait, the item giv',
      'Wait, the title says little.',
      'Hmm, the title says little. Anthropic ships a model.',
      'Anthropic ships a model. Hmm, that is all.',
      'Let me summarize: a new SDK version is out.',
      'A new SDK ships. Let me check the details.',
    ]) {
      expect([reply, Summaries.isMetaReply(reply)]).toEqual([reply, true])
    }
  })

  test('summaries about the story itself pass, meta-looking words included', () => {
    for (const reply of [
      'Security researchers get wider access to models through a vetted program.',
      'VS Code adds multi-cursor support in the text editor.',
      'The new renderer reads glyphs straight from the text buffer.',
      'Fixes crash when the text is empty.',
      'Claude Code adds a hook that edits the text.',
      'A browser ships the text-to-speech engine on every platform.',
      'Hmm, the new note-taking app, raises a seed round to sync notes offline.',
      'This article-style format lets docs pages carry bylines.',
      'This item is now sold out after the launch-day rush.',
      'Let me know if the update broke your build, the maintainers ask after a rushed release.',
      'The Wait, But Why blog returns with a long post on AI timelines.',
      'According to the title of the paper, attention is all you need for translation.',
      'The textbook on compilers gets a free second edition.',
      'A waitlist opens for the new API, with access rolling out over the month.',
      'Let’s Encrypt shortens certificate lifetimes to 45 days.',
      'Buttons without text labels now get accessible names.',
      'Users can now let mentors review pull requests before merge.',
    ]) {
      expect([reply, Summaries.isMetaReply(reply)]).toEqual([reply, false])
    }
  })
})
