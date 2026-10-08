import type { On } from 'claude-code'

import { answerOf } from './answer-of.js'
import { BELOW_BAND } from './below-band.js'
import { fsOn } from './fs-on.js'
import { registerOn } from './register-on.js'
import { storeOn } from './store-on.js'

/**
 * Answers what drawing the band and pressing its Buttons reach, recording it: the store from those entries, a mod below drawing `BELOW_BAND`, toasts, log lines (`<to>: <text>`), summaries (one line `Summary of <title>.`, three lines `<title> one.` to `<title> three.`; the asked titles kept), prompt submissions (kept, never expected), an offline web, an empty project and both session events.
 *
 * @param on the test's registrar
 * @param entries what the store holds at the start
 */
export function bandOn(on: On, entries: Readonly<Record<string, unknown>>) {
  const stored = storeOn(on, entries)
  const toasts: string[] = []
  const logs: string[] = []
  const asked: string[] = []
  const submitted: string[] = []

  registerOn(on)
  fsOn(on, {})
  on('ui.render', () => BELOW_BAND)
  on('ui.toast', ($, e) => {
    toasts.push(e.text)

    return { value: undefined }
  })
  on('ui.log', ($, e) => {
    logs.push(`${e.to ?? 'transcript'}: ${e.text}`)

    return { value: undefined }
  })
  on('model.complete', ($, e) => {
    const title = /^Title: (.*)$/m.exec(e.prompt)?.[1] ?? ''

    asked.push(title)

    const isLong = /Write \d+ to \d+ lines/.test(e.system ?? '')

    return {
      value: answerOf(
        isLong ? `${title} one.\n${title} two.\n${title} three.` : `Summary of ${title}.`,
      ),
    }
  })
  on('prompt.submit', ($, e) => {
    submitted.push(e.text)

    return { text: e.text }
  })
  on('http.fetch', () => ({ deny: 'offline' }))
  on('session.start', () => ({ cwd: '/repo' }))
  on('classic.SessionStart', () => ({}))

  return { stored, toasts, logs, asked, submitted }
}
