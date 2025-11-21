import { useState, useEffect } from 'react'
import { Server, Box, Layers, Network, AlertCircle, RefreshCw } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import StatCard from '../components/UI/StatCard'
import DataTable, { Column } from '../components/Table/DataTable'
import styles from './KubernetesPage.module.css'

interface Pod {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
}

interface Deployment {
  name: string
  namespace: string
  replicas: number
  available: number
  updated: number
  age: string
}

interface Node {
  name: string
  status: string
  roles: string[]
  version: string
  age: string
}

interface ClusterInfo {
  version: string
  nodes: number
  namespaces: number
  totalPods: number
}

function KubernetesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'pods' | 'deployments' | 'nodes'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null)
  const [pods, setPods] = useState<Pod[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [nodes, setNodes] = useState<Node[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const clusterRes = await fetch(buildApiUrl('kubernetes/cluster'))
      if (clusterRes.ok) {
        const data = await clusterRes.json()
        setClusterInfo(data.data)
      }

      if (activeTab === 'pods' || activeTab === 'overview') {
        const podsRes = await fetch(buildApiUrl('kubernetes/pods'))
        if (podsRes.ok) {
          const data = await podsRes.json()
          setPods(data.data?.pods || [])
        }
      }

      if (activeTab === 'deployments' || activeTab === 'overview') {
        const deploymentsRes = await fetch(buildApiUrl('kubernetes/deployments'))
        if (deploymentsRes.ok) {
          const data = await deploymentsRes.json()
          setDeployments(data.data?.deployments || [])
        }
      }

      if (activeTab === 'nodes' || activeTab === 'overview') {
        const nodesRes = await fetch(buildApiUrl('kubernetes/nodes'))
        if (nodesRes.ok) {
          const data = await nodesRes.json()
          setNodes(data.data?.nodes || [])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do cluster')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  // DataTable columns for Pods
  const podColumns: Column<Pod>[] = [
    { key: 'name', header: 'Nome', render: (pod) => pod.name, align: 'left' },
    { key: 'namespace', header: 'Namespace', render: (pod) => pod.namespace, align: 'left' },
    { key: 'status', header: 'Status', render: (pod) => <span className={styles.status}>{pod.status}</span>, align: 'left' },
    { key: 'ready', header: 'Ready', render: (pod) => pod.ready, align: 'center' },
    { key: 'restarts', header: 'Restarts', render: (pod) => pod.restarts, align: 'center' },
    { key: 'age', header: 'Age', render: (pod) => pod.age, align: 'left' }
  ]

  // DataTable columns for Deployments
  const deploymentColumns: Column<Deployment>[] = [
    { key: 'name', header: 'Nome', render: (deploy) => deploy.name, align: 'left' },
    { key: 'namespace', header: 'Namespace', render: (deploy) => deploy.namespace, align: 'left' },
    { key: 'replicas', header: 'Replicas', render: (deploy) => deploy.replicas, align: 'center' },
    { key: 'available', header: 'Available', render: (deploy) => deploy.available, align: 'center' },
    { key: 'updated', header: 'Updated', render: (deploy) => deploy.updated, align: 'center' },
    { key: 'age', header: 'Age', render: (deploy) => deploy.age, align: 'left' }
  ]

  // DataTable columns for Nodes
  const nodeColumns: Column<Node>[] = [
    { key: 'name', header: 'Nome', render: (node) => node.name, align: 'left' },
    { key: 'status', header: 'Status', render: (node) => <span className={styles.status}>{node.status}</span>, align: 'left' },
    { key: 'roles', header: 'Roles', render: (node) => node.roles.join(', '), align: 'left' },
    { key: 'version', header: 'Version', render: (node) => node.version, align: 'left' },
    { key: 'age', header: 'Age', render: (node) => node.age, align: 'left' }
  ]

  const renderOverview = () => (
    <Section spacing="lg">
      <div className={styles.statsGrid}>
        <StatCard icon={Server} label="Nodes" value={clusterInfo?.nodes || 0} color="blue" />
        <StatCard icon={Box} label="Pods" value={clusterInfo?.totalPods || 0} color="green" />
        <StatCard icon={Layers} label="Deployments" value={deployments.length} color="purple" />
        <StatCard icon={Network} label="Version" value={clusterInfo?.version || 'N/A'} color="yellow" />
      </div>
    </Section>
  )

  const renderPods = () => (
    <Section spacing="lg">
      <DataTable columns={podColumns} data={pods} emptyMessage="Nenhum pod encontrado" />
    </Section>
  )

  const renderDeployments = () => (
    <Section spacing="lg">
      <DataTable columns={deploymentColumns} data={deployments} emptyMessage="Nenhum deployment encontrado" />
    </Section>
  )

  const renderNodes = () => (
    <Section spacing="lg">
      <DataTable columns={nodeColumns} data={nodes} emptyMessage="Nenhum node encontrado" />
    </Section>
  )

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Server}
        title="Kubernetes"
        subtitle="Gerencie seus clusters e recursos"
        actions={
          <button className={styles.refreshButton} onClick={fetchData} disabled={loading}>
            <RefreshCw size={20} />
            <span>Atualizar</span>
          </button>
        }
      />

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'pods' ? styles.active : ''}`}
          onClick={() => setActiveTab('pods')}
        >
          Pods ({pods.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'deployments' ? styles.active : ''}`}
          onClick={() => setActiveTab('deployments')}
        >
          Deployments ({deployments.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'nodes' ? styles.active : ''}`}
          onClick={() => setActiveTab('nodes')}
        >
          Nodes ({nodes.length})
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && !error && (
        <div className={styles.loading}>Carregando...</div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'pods' && renderPods()}
          {activeTab === 'deployments' && renderDeployments()}
          {activeTab === 'nodes' && renderNodes()}
        </>
      )}
    </PageContainer>
  )
}

export default KubernetesPage
