export const mockClusters = [
  {
    id: 'cluster-prod-us-east-1',
    name: 'Production US East',
    region: 'us-east-1',
    provider: 'AWS',
    version: '1.28.3',
    status: 'ready',
    nodes: 12,
    pods: 156,
    cpu: {
      used: 68,
      total: 100
    },
    memory: {
      used: 72,
      total: 100
    }
  },
  {
    id: 'cluster-prod-eu-west-1',
    name: 'Production EU West',
    region: 'eu-west-1',
    provider: 'AWS',
    version: '1.28.3',
    status: 'ready',
    nodes: 10,
    pods: 128,
    cpu: {
      used: 54,
      total: 100
    },
    memory: {
      used: 61,
      total: 100
    }
  },
  {
    id: 'cluster-staging',
    name: 'Staging',
    region: 'us-west-2',
    provider: 'AWS',
    version: '1.28.3',
    status: 'ready',
    nodes: 5,
    pods: 42,
    cpu: {
      used: 32,
      total: 100
    },
    memory: {
      used: 38,
      total: 100
    }
  }
]

export const mockNamespaces = [
  { name: 'default', status: 'Active', pods: 8, services: 5 },
  { name: 'kube-system', status: 'Active', pods: 15, services: 8 },
  { name: 'production', status: 'Active', pods: 85, services: 42 },
  { name: 'staging', status: 'Active', pods: 32, services: 18 },
  { name: 'monitoring', status: 'Active', pods: 12, services: 6 }
]

export const mockPods = [
  {
    name: 'api-gateway-7d8f9b4c5-x8k2m',
    namespace: 'production',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    age: '5d',
    node: 'node-1'
  },
  {
    name: 'auth-service-6b5c8d9f-p4j7n',
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    restarts: 1,
    age: '3d',
    node: 'node-2'
  },
  {
    name: 'payment-service-8c9d4f5b-m3k8l',
    namespace: 'production',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    age: '2d',
    node: 'node-3'
  },
  {
    name: 'notification-service-5d6f7c8b-q9r2s',
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '7d',
    node: 'node-1'
  }
]

export const getMockClusters = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockClusters
}

export const getMockNamespaces = async (clusterId: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockNamespaces
}

export const getMockPods = async (clusterId: string, namespace?: string) => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return namespace
    ? mockPods.filter(p => p.namespace === namespace)
    : mockPods
}
