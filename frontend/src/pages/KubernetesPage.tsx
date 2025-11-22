import { useState, useEffect } from 'react'
import { Server, Box, Layers, Network, RefreshCw, AlertCircle } from 'lucide-react'
import { buildApiUrl } from '../config/api'

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
        // 404 = sem integração configurada
        if (clusterRes.status === 404) {
          setClusterInfo(null)
          setPods([])
          setDeployments([])
          setNodes([])
          setError(null)
        } else {
          // Outros erros (503, 500, etc.) = problema no serviço
          setError(`Erro ao buscar dados do Kubernetes (${clusterRes.status})`)
        }
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
      // Erro de rede ou outros erros
      setError(`Erro de conexão: ${err.message || 'Não foi possível conectar ao backend'}`)
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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 flex items-center gap-4 border border-border">
          <Server size={24} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Nodes</span>
            <span className="text-2xl font-bold text-text">{clusterInfo?.nodes || 0}</span>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-6 flex items-center gap-4 border border-border">
          <Box size={24} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Pods</span>
            <span className="text-2xl font-bold text-text">{clusterInfo?.totalPods || 0}</span>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-6 flex items-center gap-4 border border-border">
          <Layers size={24} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Deployments</span>
            <span className="text-2xl font-bold text-text">{deployments.length}</span>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-6 flex items-center gap-4 border border-border">
          <Network size={24} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Version</span>
            <span className="text-2xl font-bold text-text">{clusterInfo?.version || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPods = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
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
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">{pod.status}</span>
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
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
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">{node.status}</span>
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
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Server size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">Kubernetes</h1>
            <p className="text-base text-text-secondary">Gerencie seus clusters e recursos</p>
          </div>
        </div>
        <button className="flex items-center gap-2 py-3 px-6 bg-primary text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchData} disabled={loading}>
          <RefreshCw size={20} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="flex gap-2 border-b-2 border-border mb-6">
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold cursor-pointer relative transition-all duration-200 hover:text-text ${activeTab === 'overview' ? "text-primary after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 'text-text-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold cursor-pointer relative transition-all duration-200 hover:text-text ${activeTab === 'pods' ? "text-primary after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 'text-text-secondary'}`}
          onClick={() => setActiveTab('pods')}
        >
          Pods ({pods.length})
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold cursor-pointer relative transition-all duration-200 hover:text-text ${activeTab === 'deployments' ? "text-primary after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 'text-text-secondary'}`}
          onClick={() => setActiveTab('deployments')}
        >
          Deployments ({deployments.length})
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold cursor-pointer relative transition-all duration-200 hover:text-text ${activeTab === 'nodes' ? "text-primary after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 'text-text-secondary'}`}
          onClick={() => setActiveTab('nodes')}
        >
          Nodes ({nodes.length})
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading && (
          <div className="text-center py-15 px-5 text-lg text-text-secondary">Carregando...</div>
        )}

        {!loading && error && (
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <AlertCircle size={64} className="text-error mb-4" style={{ opacity: 0.7 }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Erro ao carregar dados</h2>
            <p className="text-base text-text-secondary max-w-[500px] mb-4">{error}</p>
            <button
              className="flex items-center gap-2 py-2 px-4 bg-primary text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-primary-dark"
              onClick={fetchData}
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && !clusterInfo && (
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <Server size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração</h2>
            <p className="text-base text-text-secondary max-w-[500px]">Configure uma integração do Kubernetes para visualizar clusters, pods e deployments</p>
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
