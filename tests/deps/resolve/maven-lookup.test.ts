import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('maven-lookup', () => {
  const BASE = 'https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind'
  const NAME = 'com.fasterxml.jackson.core:jackson-databind'

  test("reads the pom's scm url for the version in use, not the project or license url", async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(`${BASE}/2.17.2/jackson-databind-2.17.2.pom`, {
      status: 200,
      text: Registries.MAVEN_JACKSON_DATABIND_POM,
    })

    expect(
      await Resolve.mavenLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt(NAME, { ecosystem: 'maven', versionInUse: '2.17.2' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'FasterXML/jackson-databind' })
    expect(fetched).toEqual([`${BASE}/2.17.2/jackson-databind-2.17.2.pom`])
  })

  test('without a version in use, reads the release maven-metadata.xml names', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(`${BASE}/maven-metadata.xml`, {
      status: 200,
      text: Registries.MAVEN_JACKSON_DATABIND_METADATA,
    })
    web.set(`${BASE}/2.22.3/jackson-databind-2.22.3.pom`, {
      status: 200,
      text: Registries.MAVEN_JACKSON_DATABIND_POM,
    })

    expect(
      await Resolve.mavenLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt(NAME, { ecosystem: 'maven' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'FasterXML/jackson-databind' })
    expect(fetched).toEqual([
      `${BASE}/maven-metadata.xml`,
      `${BASE}/2.22.3/jackson-databind-2.22.3.pom`,
    ])
  })

  test('a version in use the registry lacks falls back to the release', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set(`${BASE}/9.9.9/jackson-databind-9.9.9.pom`, { status: 404, text: '' })
    web.set(`${BASE}/maven-metadata.xml`, {
      status: 200,
      text: Registries.MAVEN_JACKSON_DATABIND_METADATA,
    })
    web.set(`${BASE}/2.22.3/jackson-databind-2.22.3.pom`, {
      status: 200,
      text: Registries.MAVEN_JACKSON_DATABIND_POM,
    })

    const lookup = await Resolve.mavenLookup(
      url => Resolve.fetchGently(host, url),
      Fixtures.depAt(NAME, { ecosystem: 'maven', versionInUse: '9.9.9' }),
    )

    expect(lookup).toEqual({ kind: 'repo', repo: 'FasterXML/jackson-databind' })
    expect(fetched.length).toBe(3)
  })

  test('a pom whose scm uses only a connection reads it without the scm:git: prefix', async () => {
    const { host, web } = Fixtures.fakeHostOf()

    web.set(`${BASE}/1.0.0/jackson-databind-1.0.0.pom`, {
      status: 200,
      text: '<project><url>https://example.com</url><scm><connection>scm:git:git@github.com:o/r.git</connection></scm></project>',
    })

    expect(
      await Resolve.mavenLookup(
        url => Resolve.fetchGently(host, url),
        Fixtures.depAt(NAME, { ecosystem: 'maven', versionInUse: '1.0.0' }),
      ),
    ).toEqual({ kind: 'repo', repo: 'o/r' })
  })

  test('a name that could change the path or query is refused with no request', async () => {
    for (const name of [
      'com.example:art?x=1',
      'com.example:ar#t',
      'com.example:..',
      '..:art',
      'com..example:art',
      'com.example.:art',
      '.com:art',
      'com/example:art',
      'com.example:art:extra',
      'com.ex ample:art',
      'com.example',
    ]) {
      const { host, fetched } = Fixtures.fakeHostOf()

      expect(
        await Resolve.mavenLookup(
          url => Resolve.fetchGently(host, url),
          Fixtures.depAt(name, { ecosystem: 'maven' }),
        ),
      ).toEqual({ kind: 'none', reason: 'not a valid maven name' })
      expect(fetched).toEqual([])
    }
  })
})
