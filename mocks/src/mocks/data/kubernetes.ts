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

export interface Pod {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
}

export interface Deployment {
  name: string
  namespace: string
  replicas: number
  available: number
  updated: number
  age: string
}

export interface Node {
  name: string
  status: string
  roles: string[]
  version: string
  age: string
}

export interface ClusterInfo {
  version: string
  nodes: number
  namespaces: number
  totalPods: number
}

export const mockPods: Pod[] = [
  {
    name: 'api-gateway-7d8f9b4c5-x8k2m',
    namespace: 'production',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    age: '5d'
  },
  {
    name: 'api-gateway-7d8f9b4c5-abc12',
    namespace: 'production',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    age: '5d'
  },
  {
    name: 'auth-service-6b5c8d9f-p4j7n',
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    restarts: 1,
    age: '3d'
  },
  {
    name: 'auth-service-6b5c8d9f-def34',
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '3d'
  },
  {
    name: 'payment-service-8c9d4f5b-m3k8l',
    namespace: 'production',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    age: '2d'
  },
  {
    name: 'user-service-5a6b7c8d-q9r2s',
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '4d'
  },
  {
    name: 'notification-service-5d6f7c8b-q9r2s',
    namespace: 'production',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '7d'
  },
  {
    name: 'api-gateway-staging-9e0f1a2b-c3d4e',
    namespace: 'staging',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    age: '1d'
  },
  {
    name: 'auth-service-staging-7b8c9d0e-f1g2h',
    namespace: 'staging',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '1d'
  },
  {
    name: 'payment-service-staging-6a7b8c9d-e0f1g',
    namespace: 'staging',
    status: 'Running',
    ready: '2/2',
    restarts: 1,
    age: '2d'
  }
]

export const mockDeployments: Deployment[] = [
  {
    name: 'api-gateway',
    namespace: 'production',
    replicas: 3,
    available: 3,
    updated: 3,
    age: '5d'
  },
  {
    name: 'auth-service',
    namespace: 'production',
    replicas: 2,
    available: 2,
    updated: 2,
    age: '3d'
  },
  {
    name: 'payment-service',
    namespace: 'production',
    replicas: 2,
    available: 2,
    updated: 2,
    age: '2d'
  },
  {
    name: 'user-service',
    namespace: 'production',
    replicas: 2,
    available: 2,
    updated: 2,
    age: '4d'
  },
  {
    name: 'notification-service',
    namespace: 'production',
    replicas: 1,
    available: 1,
    updated: 1,
    age: '7d'
  },
  {
    name: 'api-gateway',
    namespace: 'staging',
    replicas: 1,
    available: 1,
    updated: 1,
    age: '1d'
  },
  {
    name: 'auth-service',
    namespace: 'staging',
    replicas: 1,
    available: 1,
    updated: 1,
    age: '1d'
  },
  {
    name: 'payment-service',
    namespace: 'staging',
    replicas: 1,
    available: 1,
    updated: 1,
    age: '2d'
  }
]

export const mockNodes: Node[] = [
  {
    name: 'node-1',
    status: 'Ready',
    roles: ['worker'],
    version: 'v1.28.3',
    age: '45d'
  },
  {
    name: 'node-2',
    status: 'Ready',
    roles: ['worker'],
    version: 'v1.28.3',
    age: '45d'
  },
  {
    name: 'node-3',
    status: 'Ready',
    roles: ['worker'],
    version: 'v1.28.3',
    age: '42d'
  },
  {
    name: 'node-4',
    status: 'Ready',
    roles: ['master'],
    version: 'v1.28.3',
    age: '45d'
  }
]

export const mockClusterInfo: ClusterInfo = {
  version: 'v1.28.3',
  nodes: 4,
  namespaces: 5,
  totalPods: 10
}

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

export const getMockClusterInfo = async (): Promise<ClusterInfo> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockClusterInfo
}

export const getMockKubernetesPods = async (): Promise<{ pods: Pod[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { pods: mockPods }
}

export const getMockKubernetesDeployments = async (): Promise<{ deployments: Deployment[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { deployments: mockDeployments }
}

export const getMockKubernetesNodes = async (): Promise<{ nodes: Node[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { nodes: mockNodes }
}
