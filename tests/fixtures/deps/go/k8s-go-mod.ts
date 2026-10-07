/**
 * kubernetes/kubernetes go.mod, require and replace blocks trimmed.
 */
export const K8S_GO_MOD = `// This is a generated file. Do not edit directly.
// Ensure you've carefully read
// https://git.k8s.io/community/contributors/devel/sig-architecture/vendor.md
// Run hack/pin-dependency.sh to change pinned dependency versions.
// Run hack/update-vendor.sh to update go.mod files and the vendor directory.

module k8s.io/kubernetes

go 1.27.0

godebug default=go1.27

require (
	bitbucket.org/bertimus9/systemstat v0.5.0
	github.com/google/go-cmp v0.7.0
	github.com/google/uuid v1.6.0
	github.com/spf13/cobra v1.10.2
	golang.org/x/net v0.59.0
	k8s.io/api v0.0.0
	k8s.io/apimachinery v0.0.0
	k8s.io/client-go v0.0.0
	k8s.io/klog/v2 v2.140.0
)

require (
	cel.dev/expr v0.25.2 // indirect
)

replace (
	k8s.io/api => ./staging/src/k8s.io/api
	k8s.io/apimachinery => ./staging/src/k8s.io/apimachinery
	k8s.io/client-go => ./staging/src/k8s.io/client-go
)
`
