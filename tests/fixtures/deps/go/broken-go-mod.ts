/**
 * kubernetes/kubernetes client-go go.mod cut off inside its require block.
 */
export const BROKEN_GO_MOD = `module k8s.io/client-go

go 1.27.0

require (
	github.com/google/go-cmp v0.7.0
	golang.org/x/oauth2 v0.37.0
`
