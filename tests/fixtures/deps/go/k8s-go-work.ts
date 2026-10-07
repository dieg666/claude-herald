/**
 * kubernetes/kubernetes go.work, trimmed to three staging modules.
 */
export const K8S_GO_WORK = `// This is a generated file. Do not edit directly.

go 1.27.0

godebug default=go1.27

use (
	.
	./staging/src/k8s.io/api
	./staging/src/k8s.io/apimachinery
	./staging/src/k8s.io/client-go
)
`
