/**
 * Go vanity hosts whose `go-import` page is read when the Go proxy names no GitHub origin; modules on other hosts stay unresolved.
 */
export const GO_IMPORT_HOSTS: readonly string[] = [
  'gopkg.in',
  'go.uber.org',
  'k8s.io',
  'sigs.k8s.io',
  'google.golang.org',
  'go.opentelemetry.io',
  'go.etcd.io',
  'go.yaml.in',
  'gotest.tools',
  'honnef.co',
]
