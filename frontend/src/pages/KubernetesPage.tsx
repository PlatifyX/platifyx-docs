import { useState, useEffect } from 'react'
import { Server, Box, Layers, Network, AlertCircle, RefreshCw } from 'lucide-react'
import { buildApiUrl } from '../config/api'
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
      if (!clusterRes.ok) {
        // Se não houver integração do Kubernetes, trata como sem integração
        setClusterInfo(null)
        setPods([])
        setDeployments([])
        setNodes([])
        setLoading(false)
        return
      }

      const data = await clusterRes.json()
      setClusterInfo(data)

      if (activeTab === 'pods' || activeTab === 'overview') {
        const podsRes = await fetch(buildApiUrl('kubernetes/pods'))
        if (podsRes.ok) {
          const data = await podsRes.json()
          setPods(data.pods || [])
        }
      }

      if (activeTab === 'deployments' || activeTab === 'overview') {
        const deploymentsRes = await fetch(buildApiUrl('kubernetes/deployments'))
        if (deploymentsRes.ok) {
          const data = await deploymentsRes.json()
          setDeployments(data.deployments || [])
        }
      }

      if (activeTab === 'nodes' || activeTab === 'overview') {
        const nodesRes = await fetch(buildApiUrl('kubernetes/nodes'))
        if (nodesRes.ok) {
          const data = await nodesRes.json()
          setNodes(data.nodes || [])
        }
      }
    } catch (err: any) {
      // Em caso de erro de rede ou outros, também trata como sem integração
      setClusterInfo(null)
      setPods([])
      setDeployments([])
      setNodes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Server size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Nodes</span>
            <span className={styles.statValue}>{clusterInfo?.nodes || 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Box size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pods</span>
            <span className={styles.statValue}>{clusterInfo?.totalPods || 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Layers size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Deployments</span>
            <span className={styles.statValue}>{deployments.length}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Network size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Version</span>
            <span className={styles.statValue}>{clusterInfo?.version || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPods = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Namespace</th>
            <th>Status</th>
            <th>Ready</th>
            <th>Restarts</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {pods.map((pod, idx) => (
            <tr key={idx}>
              <td>{pod.name}</td>
              <td>{pod.namespace}</td>
              <td>
                <span className={styles.status}>{pod.status}</span>
              </td>
              <td>{pod.ready}</td>
              <td>{pod.restarts}</td>
              <td>{pod.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderDeployments = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Namespace</th>
            <th>Replicas</th>
            <th>Available</th>
            <th>Updated</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map((deploy, idx) => (
            <tr key={idx}>
              <td>{deploy.name}</td>
              <td>{deploy.namespace}</td>
              <td>{deploy.replicas}</td>
              <td>{deploy.available}</td>
              <td>{deploy.updated}</td>
              <td>{deploy.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderNodes = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Status</th>
            <th>Roles</th>
            <th>Version</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, idx) => (
            <tr key={idx}>
              <td>{node.name}</td>
              <td>
                <span className={styles.status}>{node.status}</span>
              </td>
              <td>{node.roles.join(', ')}</td>
              <td>{node.version}</td>
              <td>{node.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Server size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Kubernetes</h1>
            <p className={styles.subtitle}>Gerencie seus clusters e recursos</p>
          </div>
        </div>
        <button className={styles.refreshButton} onClick={fetchData} disabled={loading}>
          <RefreshCw size={20} />
          <span>Atualizar</span>
        </button>
      </div>

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

      <div className={styles.content}>
        {loading && (
          <div className={styles.loading}>Carregando...</div>
        )}

        {!loading && !clusterInfo && (
          <div className={styles.emptyState}>
            <Server size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2>Nenhuma integração</h2>
            <p>Configure uma integração do Kubernetes para visualizar clusters, pods e deployments</p>
          </div>
        )}

        {!loading && clusterInfo && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'pods' && renderPods()}
            {activeTab === 'deployments' && renderDeployments()}
            {activeTab === 'nodes' && renderNodes()}
          </>
        )}
      </div>
    </div>
  )
}

export default KubernetesPage
