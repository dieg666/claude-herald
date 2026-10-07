import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Maven from '../../fixtures/deps/maven'

describe('maven-detector', () => {
  const PETCLINIC = { 'pom.xml': Maven.PETCLINIC_POM }

  test('the parent is followed like a dependency at its version', async () => {
    const { dependencies } = await Fixtures.scanOf(PETCLINIC)

    expect(
      Fixtures.depNamed(dependencies, 'org.springframework.boot:spring-boot-starter-parent'),
    ).toEqual({
      ecosystem: 'maven',
      name: 'org.springframework.boot:spring-boot-starter-parent',
      versionInUse: '4.1.0',
      range: '4.1.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'pom.xml',
    })
  })

  test('${property} versions resolve from <properties>; managed versions stay empty', async () => {
    const { dependencies } = await Fixtures.scanOf(PETCLINIC)

    expect(Fixtures.depNamed(dependencies, 'org.webjars.npm:bootstrap')).toMatchObject({
      versionInUse: '5.3.8',
      isDev: false,
    })
    expect(Fixtures.depNamed(dependencies, 'com.h2database:h2')).toEqual({
      ecosystem: 'maven',
      name: 'com.h2database:h2',
      isDev: false,
      isRoot: true,
      manifestPath: 'pom.xml',
    })
  })

  test('plugin and managed dependencies are not the project dependencies', async () => {
    const { dependencies } = await Fixtures.scanOf(PETCLINIC)

    expect(Fixtures.depNamed(dependencies, 'com.puppycrawl.tools:checkstyle')).toBeUndefined()
    expect(
      Fixtures.depNamed(dependencies, 'io.spring.javaformat:spring-javaformat-checkstyle'),
    ).toBeUndefined()
  })

  test('test scope and optional dependencies are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(PETCLINIC, { cap: 500 })
    const all = await Fixtures.detectedOf(PETCLINIC, { cap: 500, includeDev: true })
    const devtools = 'org.springframework.boot:spring-boot-devtools'

    expect(Fixtures.depNamed(runtime.project?.dependencies ?? [], devtools)).toBeUndefined()
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], devtools)?.isDev).toBe(true)
    expect(
      Fixtures.depNamed(
        all.project?.dependencies ?? [],
        'org.springframework.boot:spring-boot-starter-data-jpa-test',
      )?.isDev,
    ).toBe(true)
  })

  test('a pom cut off mid-way is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({ 'pom.xml': Maven.BROKEN_POM })

    expect(dependencies).toEqual([])
    expect(logs).toContain('news: deps: skipped pom.xml: not a complete <project> document')
  })
})
