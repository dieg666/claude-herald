/**
 * kubernetes/kubernetes staging/src/k8s.io/client-go/go.mod, require blocks trimmed.
 */
export const K8S_CLIENT_GO_GO_MOD = `// This is a generated file. Do not edit directly.

module k8s.io/client-go

go 1.27.0

godebug default=go1.27

require (
	github.com/google/go-cmp v0.7.0
	github.com/gorilla/websocket v1.5.4-0.20250319132907-e064f32e3674
	golang.org/x/oauth2 v0.37.0
	k8s.io/api v0.0.0
	k8s.io/apimachinery v0.0.0
	k8s.io/klog/v2 v2.140.0
)

require (
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
)

replace (
	k8s.io/api => ../api
	k8s.io/apimachinery => ../apimachinery
)
`
