import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('pasted-commands-of', () => {
  test('text without a line starting with / is one command, its line breaks kept', () => {
    expect(Commands.pastedCommandsOf('  template Read this\n{title}\n\n  {url}  ')).toEqual([
      'template Read this\n{title}\n\n  {url}',
    ])
  })

  test('each line starting with /, after any spaces, starts a command', () => {
    expect(
      Commands.pastedCommandsOf('add https://a.example/x.xml\n  /herald list\n/help me\n/HERALD'),
    ).toEqual(['add https://a.example/x.xml', '/herald list', '/help me', '/HERALD'])
  })

  test('lines without a slash join the command above them', () => {
    expect(
      Commands.pastedCommandsOf('list\n/herald template A\nB {title}\n/herald deps template x\ny'),
    ).toEqual(['list', '/herald template A\nB {title}', '/herald deps template x\ny'])
  })

  test('CRLF and a lone CR break lines as LF does, and are joined as LF', () => {
    expect(Commands.pastedCommandsOf('template A\r\nB {url}\r/herald list\r\n')).toEqual([
      'template A\nB {url}',
      '/herald list',
    ])
  })

  test('blank lines around commands are dropped from them', () => {
    expect(Commands.pastedCommandsOf('list\n\n   \n/herald help\r\n\r\n')).toEqual([
      'list',
      '/herald help',
    ])
  })

  test('the first line is always the first command, blank when /herald stood alone, a slash at its start included', () => {
    expect(Commands.pastedCommandsOf('\n \t\r\n/herald list\n/herald help')).toEqual([
      '',
      '/herald list',
      '/herald help',
    ])
    expect(Commands.pastedCommandsOf('/help\n/herald list')).toEqual(['/help', '/herald list'])
    expect(Commands.pastedCommandsOf('\nlist')).toEqual(['list'])
  })

  test('nothing, or only blank lines, is one blank command', () => {
    expect(Commands.pastedCommandsOf('')).toEqual([''])
    expect(Commands.pastedCommandsOf(' \n\r\n ')).toEqual([''])
  })
})
