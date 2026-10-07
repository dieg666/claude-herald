import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Fixtures from '../../fixtures'
import Registries from '../../fixtures/registries'

describe('go-lookup', () => {
  const go = (name: string) => Fixtures.depAt(name, { ecosystem: 'go' })

  for (const [module, repo] of [
    ['github.com/spf13/cobra', 'spf13/cobra'],
    ['github.com/jackc/pgx/v5', 'jackc/pgx'],
    ['github.com/aws/aws-sdk-go-v2/service/s3', 'aws/aws-sdk-go-v2'],
    ['github.com/Azure/azure-sdk-for-go/sdk/azcore', 'Azure/azure-sdk-for-go'],
    ['golang.org/x/net', 'golang/net'],
    ['golang.org/x/crypto/ssh', 'golang/crypto'],
  ] as const) {
    test(`${module} is ${repo} without a request`, async () => {
      const { host, fetched } = Fixtures.fakeHostOf()

      expect(await Resolve.goLookup(url => Resolve.fetchGently(host, url), go(module))).toEqual({
        kind: 'repo',
        repo,
      })
      expect(fetched).toEqual([])
    })
  }

  test("another module path reads the Go proxy's origin", async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://proxy.golang.org/k8s.io/client-go/@latest', {
      status: 200,
      text: Registries.GO_CLIENT_GO_LATEST,
    })

    expect(
      await Resolve.goLookup(url => Resolve.fetchGently(host, url), go('k8s.io/client-go')),
    ).toEqual({ kind: 'repo', repo: 'kubernetes/client-go' })
    expect(fetched).toEqual(['https://proxy.golang.org/k8s.io/client-go/@latest'])
  })

  test('upper-case letters are escaped for the proxy', () => {
    expect(Resolve.goProxyPathOf('example.com/BurntSushi/Toml')).toBe(
      'example.com/!burnt!sushi/!toml',
    )
  })

  test('without a proxy origin, a known vanity host is asked for its go-source meta', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://proxy.golang.org/gopkg.in/yaml.v3/@latest', {
      status: 200,
      text: Registries.GO_YAML_V3_LATEST,
    })
    web.set('https://gopkg.in/yaml.v3?go-get=1', {
      status: 200,
      text: Registries.GOPKG_YAML_V3_META,
    })

    expect(
      await Resolve.goLookup(url => Resolve.fetchGently(host, url), go('gopkg.in/yaml.v3')),
    ).toEqual({ kind: 'repo', repo: 'go-yaml/yaml' })
    expect(fetched).toEqual([
      'https://proxy.golang.org/gopkg.in/yaml.v3/@latest',
      'https://gopkg.in/yaml.v3?go-get=1',
    ])
  })

  test("the go-import meta's repository URL is read for a sub-package of its prefix", () => {
    expect(Resolve.goMetaRepoOf(Registries.GO_ZAP_META, 'go.uber.org/zap/zapcore')).toBe(
      'uber-go/zap',
    )
    expect(Resolve.goMetaRepoOf(Registries.GO_ZAP_META, 'go.uber.org/zapper')).toBeUndefined()
  })

  test('an unknown vanity host is never contacted', async () => {
    const { host, web, fetched } = Fixtures.fakeHostOf()

    web.set('https://proxy.golang.org/example.org/mod/@latest', {
      status: 200,
      text: '{"Version":"v1.0.0"}',
    })

    expect(
      await Resolve.goLookup(url => Resolve.fetchGently(host, url), go('example.org/mod')),
    ).toEqual({ kind: 'none', reason: 'no GitHub origin from the Go proxy' })
    expect(fetched).toEqual(['https://proxy.golang.org/example.org/mod/@latest'])
  })
})
