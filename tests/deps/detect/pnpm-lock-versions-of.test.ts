import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('pnpm-lock-versions-of', () => {
  const V9 = [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  .:',
    '    dependencies:',
    '      react:',
    '        specifier: ^18.3.0',
    '        version: 18.3.1',
    '      react-dom:',
    '        specifier: ^18.3.0',
    '        version: 18.3.1(react@18.3.1)',
    '      strings:',
    '        specifier: npm:string-width@^4.2.0',
    '        version: string-width@4.2.3',
    '      ui:',
    '        specifier: npm:@acme/ui@^2.0.0',
    "        version: '@acme/ui@2.1.0(react@18.3.1)'",
    '      local:',
    '        specifier: link:../local',
    '        version: link:../local',
    '',
    '  packages/web:',
    '    devDependencies:',
    '      vite:',
    '        specifier: ^5.0.0',
    '        version: 5.4.2',
    '',
  ].join('\n')

  const V6 = [
    "lockfileVersion: '6.0'",
    '',
    'dependencies:',
    '  react-dom:',
    '    specifier: ^18.3.0',
    '    version: 18.3.1(react@18.3.1)',
    '  strings:',
    '    specifier: npm:string-width@^4.2.0',
    '    version: /string-width@4.2.3',
    '  ui:',
    '    specifier: npm:@acme/ui@^2.0.0',
    '    version: /@acme/ui@2.1.0(react@18.3.1)',
    '',
  ].join('\n')

  const V5 = [
    'lockfileVersion: 5.4',
    '',
    'specifiers:',
    '  react-dom: ^18.2.0',
    '  strings: npm:string-width@^4.2.0',
    '  ui: npm:@acme/ui@^2.0.0',
    '',
    'dependencies:',
    '  react-dom: 18.2.0_react@18.2.0',
    '  strings: /string-width/4.2.3',
    '  ui: /@acme/ui/2.1.0_react@18.2.0',
    '',
  ].join('\n')

  test('v9: each importer answers its own versions, peer suffixes dropped', () => {
    const lookup = Detect.pnpmLockVersionsOf(V9)

    expect(lookup('.', 'react')).toBe('18.3.1')
    expect(lookup('.', 'react-dom')).toBe('18.3.1')
    expect(lookup('packages/web', 'vite')).toBe('5.4.2')
    expect(lookup('packages/web', 'react')).toBeUndefined()
    expect(lookup('.', 'vite')).toBeUndefined()
  })

  test('v9: an alias answers the version of the package it stands for', () => {
    const lookup = Detect.pnpmLockVersionsOf(V9)

    expect(lookup('.', 'strings')).toBe('4.2.3')
    expect(lookup('.', 'ui')).toBe('2.1.0')
  })

  test('v6: an alias written as /name@version answers the version alone', () => {
    const lookup = Detect.pnpmLockVersionsOf(V6)

    expect(lookup('.', 'strings')).toBe('4.2.3')
    expect(lookup('.', 'ui')).toBe('2.1.0')
    expect(lookup('.', 'react-dom')).toBe('18.3.1')
  })

  test('v5: plain versions and /name/version aliases lose their peer suffix', () => {
    const lookup = Detect.pnpmLockVersionsOf(V5)

    expect(lookup('.', 'react-dom')).toBe('18.2.0')
    expect(lookup('.', 'strings')).toBe('4.2.3')
    expect(lookup('.', 'ui')).toBe('2.1.0')
  })

  test('a link is not a version', () => {
    expect(Detect.pnpmLockVersionsOf(V9)('.', 'local')).toBeUndefined()
  })

  test('a file that holds no mapping is not a pnpm lockfile', () => {
    expect(() => Detect.pnpmLockVersionsOf('- a\n- b\n')).toThrow('not a pnpm lockfile')
  })
})
