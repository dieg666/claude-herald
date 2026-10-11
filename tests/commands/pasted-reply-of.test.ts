import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('pasted-reply-of', () => {
  test('each answer follows its heading, blocks apart by a blank line', () => {
    expect(
      Commands.pastedReplyOf([
        { heading: '/herald list', reply: { text: 'Two sources.' } },
        { heading: '/help', reply: { text: 'Not ours.\nSkipped.' } },
      ]),
    ).toEqual({ text: '/herald list\nTwo sources.\n\n/help\nNot ours.\nSkipped.' })
  })

  test('keeps every follow-up any answer asked for, and none that no answer asked for', () => {
    const reply = Commands.pastedReplyOf([
      { heading: '/herald interval 7', reply: { text: 'a', restartRefresh: true } },
      { heading: '/herald rotate 30', reply: { text: 'b', restartRotation: true } },
      { heading: '/herald lang es', reply: { text: 'c', resyncSummaries: false } },
      { heading: '/herald deps rescan', reply: { text: 'd', rescanStack: true } },
    ])

    expect(reply).toEqual({
      text: '/herald interval 7\na\n\n/herald rotate 30\nb\n\n/herald lang es\nc\n\n/herald deps rescan\nd',
      restartRefresh: true,
      restartRotation: true,
      rescanStack: true,
    })
  })

  test('lists the commands left unrun after an interruption', () => {
    expect(
      Commands.pastedReplyOf(
        [{ heading: '/herald list', reply: { text: 'Two sources.' } }],
        ['/herald disable x', 'enable y'],
      ),
    ).toEqual({
      text: '/herald list\nTwo sources.\n\nInterrupted, so these commands did not run:\n/herald disable x\nenable y',
    })
  })
})
