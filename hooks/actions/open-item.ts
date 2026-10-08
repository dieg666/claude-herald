import type { Item } from '../../types/index.js'
import { httpUrlOf } from '../commands/http-url-of.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { openerArgvOf } from './opener-argv-of.js'
import { platformOf } from './platform-of.js'
import { readItem } from './read-item.js'
import { titleLineOf } from './title-line-of.js'

/**
 * Opens an item's address in the default browser with the platform's opener, recording it as read once the opener exits cleanly; an address that is not http(s) is refused and a failure toasted, never thrown.
 *
 * @param host the engine
 * @param item the item to open
 * @returns whether the opener ran and exited cleanly
 */
export async function openItem(host: Host, item: Item): Promise<boolean> {
  const url = httpUrlOf(item.url)?.href

  if (url === undefined) {
    host.toast(`Not opened: "${titleLineOf(item.title)}" has no web address.`)

    return false
  }

  const argv = openerArgvOf(await platformOf(host), url)
  let reason: string

  try {
    const { exitCode, stderr } = await host.processRun(argv, { timeoutMs: 10_000 })

    if (exitCode === 0) {
      await readItem(host, item)

      return true
    }

    reason = `${argv[0]} exited with ${exitCode}${stderr.trim() === '' ? '' : `: ${messageOf(stderr)}`}`
  } catch (error) {
    reason = messageOf(error)
  }

  host.debug(`herald: could not open ${url}: ${reason}`)
  host.toast(`Could not open the link: ${reason}`)

  return false
}
