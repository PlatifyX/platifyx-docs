import { useState, useEffect } from 'react'
import { Server, Box, RefreshCw, AlertCircle, X, Terminal, Activity, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { apiFetch } from '../config/api'
import IntegrationSelector from '../components/Common/IntegrationSelector'

interface Pod {
  name: string
  namespace: string
  status: string
  ready: string
  restarts: number
  age: string
  node?: string
  ip?: string
}

interface ClusterInfo {
  version: string
  nodes: number
  namespaces: number
  totalPods: number
  podMetrics?: {
    [key: string]: number
  }
}

interface PodLogs {
  pod: string
  namespace: string
  container: string
  logs: string
}

function KubernetesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'pods'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')

  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null)
  const [pods, setPods] = useState<Pod[]>([])

  // Estado para logs de pods
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null)
  const [podLogs, setPodLogs] = useState<PodLogs | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedIntegration) params.append('integration', selectedIntegration)

      const clusterRes = await apiFetch(`kubernetes/cluster?${params.toString()}`)
      if (!clusterRes.ok) {
        if (clusterRes.status === 400) {
          const errorData = await clusterRes.json().catch(() => ({}))
          setError(errorData.error || 'Organization UUID is required')
        } else if (clusterRes.status === 404) {
          setClusterInfo(null)
          setPods([])
          setError(null)
        } else {
          setError(`Erro ao buscar dados do Kubernetes (${clusterRes.status})`)
        }
        setLoading(false)
        return
      }

      const data = await clusterRes.json()
      setClusterInfo(data)

      // Buscar pods sempre para ter dados no overview e na aba de pods
      const podsParams = new URLSearchParams()
      if (selectedIntegration) podsParams.append('integration', selectedIntegration)
      const podsRes = await apiFetch(`kubernetes/pods?${podsParams.toString()}`)
      if (podsRes.ok) {
        const podsData = await podsRes.json()
        setPods(podsData.pods || [])
      }
    } catch (err: any) {
      setError(`Erro de conexão: ${err.message || 'Não foi possível conectar ao backend'}`)
      setClusterInfo(null)
      setPods([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPodLogs = async (pod: Pod) => {
    setLoadingLogs(true)
    try {
      const params = new URLSearchParams()
      if (selectedIntegration) params.append('integration', selectedIntegration)
      params.append('namespace', pod.namespace)
      params.append('tailLines', '500')

      const logsRes = await apiFetch(`kubernetes/pods/${pod.name}/logs?${params.toString()}`)
      if (logsRes.ok) {
        const data = await logsRes.json()
        setPodLogs(data)
      } else {
        const errorData = await logsRes.json().catch(() => ({ error: 'Erro ao buscar logs' }))
        setError(errorData.error)
      }
    } catch (err: any) {
      setError(`Erro ao buscar logs: ${err.message}`)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handlePodClick = (pod: Pod) => {
    setSelectedPod(pod)
    setPodLogs(null)
    fetchPodLogs(pod)
  }

  const closePodLogs = () => {
    setSelectedPod(null)
    setPodLogs(null)
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedIntegration])

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'running') return 'text-green-500 bg-green-500/10'
    if (statusLower === 'pending') return 'text-yellow-500 bg-yellow-500/10'
    if (statusLower === 'failed' || statusLower === 'error') return 'text-red-500 bg-red-500/10'
    if (statusLower === 'succeeded' || statusLower === 'completed') return 'text-blue-500 bg-blue-500/10'
    if (statusLower === 'unknown') return 'text-gray-500 bg-gray-500/10'
    return 'text-gray-500 bg-gray-500/10'
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'running') return <CheckCircle size={20} className="text-green-500" />
    if (statusLower === 'pending') return <Clock size={20} className="text-yellow-500" />
    if (statusLower === 'failed' || statusLower === 'error') return <XCircle size={20} className="text-red-500" />
    if (statusLower === 'succeeded' || statusLower === 'completed') return <CheckCircle size={20} className="text-blue-500" />
    return <AlertTriangle size={20} className="text-gray-500" />
  }

  const renderOverview = () => {
    const podMetrics = clusterInfo?.podMetrics || {}
    const statusEntries = Object.entries(podMetrics).sort((a, b) => b[1] - a[1])

    return (
      <div className="space-y-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Server size={24} className="text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-secondary mb-1">Nodes</span>
                <span className="text-3xl font-bold text-text">{clusterInfo?.nodes || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Box size={24} className="text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-secondary mb-1">Total Pods</span>
                <span className="text-3xl font-bold text-text">{clusterInfo?.totalPods || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Activity size={24} className="text-purple-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-secondary mb-1">Namespaces</span>
                <span className="text-3xl font-bold text-text">{clusterInfo?.namespaces || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-secondary mb-1">Versão</span>
                <span className="text-lg font-bold text-text">{clusterInfo?.version || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de Status dos Pods */}
        {statusEntries.length > 0 && (
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Status dos Pods
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {statusEntries.map(([status, count]) => (
                <div
                  key={status}
                  className={`rounded-lg p-4 border border-border ${getStatusColor(status)} transition-all hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {getStatusIcon(status)}
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <div className="text-sm font-medium capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista resumida de pods por namespace */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <h3 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
            <Box size={20} className="text-primary" />
            Pods Recentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Namespace</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Ready</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Restarts</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Age</th>
                </tr>
              </thead>
              <tbody>
                {pods.slice(0, 10).map((pod, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-background transition-colors cursor-pointer"
                    onClick={() => handlePodClick(pod)}
                  >
                    <td className="py-3 px-4 text-text font-medium">{pod.name}</td>
                    <td className="py-3 px-4 text-text-secondary">{pod.namespace}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pod.status)}`}>
                        {pod.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text">{pod.ready}</td>
                    <td className="py-3 px-4 text-text">{pod.restarts}</td>
                    <td className="py-3 px-4 text-text-secondary">{pod.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pods.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveTab('pods')}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Ver todos os {pods.length} pods →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPods = () => (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-background">
        <h3 className="text-lg font-semibold text-text flex items-center gap-2">
          <Box size={20} className="text-primary" />
          Todos os Pods ({pods.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Nome</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Namespace</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Ready</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Restarts</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Age</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod, idx) => (
              <tr
                key={idx}
                className="border-b border-border hover:bg-background transition-colors"
              >
                <td className="py-3 px-4 text-text font-medium">{pod.name}</td>
                <td className="py-3 px-4 text-text-secondary">{pod.namespace}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pod.status)}`}>
                    {pod.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-text">{pod.ready}</td>
                <td className="py-3 px-4 text-text">{pod.restarts}</td>
                <td className="py-3 px-4 text-text-secondary">{pod.age}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handlePodClick(pod)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    <Terminal size={16} />
                    Ver Logs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pods.length === 0 && (
        <div className="p-12 text-center text-text-secondary">
          <Box size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nenhum pod encontrado</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Server size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">Kubernetes</h1>
            <p className="text-base text-text-secondary">Gerencie seus clusters e recursos</p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 py-3 px-6 bg-primary text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Integration Selector */}
      <IntegrationSelector
        integrationType="kubernetes"
        selectedIntegration={selectedIntegration}
        onIntegrationChange={setSelectedIntegration}
      />

      {/* Tabs */}
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
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading && (
          <div className="text-center py-20 px-5">
            <RefreshCw size={48} className="mx-auto mb-4 text-primary animate-spin" />
            <p className="text-lg text-text-secondary">Carregando dados do cluster...</p>
          </div>
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
            <Server size={64} className="text-text-secondary mb-4" style={{ opacity: 0.3 }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração configurada</h2>
            <p className="text-base text-text-secondary max-w-[500px]">Configure uma integração do Kubernetes para visualizar clusters e pods</p>
          </div>
        )}

        {!loading && clusterInfo && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'pods' && renderPods()}
          </>
        )}
      </div>

      {/* Modal de Logs do Pod */}
      {selectedPod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-border">
            {/* Header do Modal */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-text flex items-center gap-2">
                  <Terminal size={24} className="text-primary" />
                  Logs do Pod
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  <span className="font-medium">{selectedPod.name}</span> • Namespace: {selectedPod.namespace}
                </p>
              </div>
              <button
                onClick={closePodLogs}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <X size={24} className="text-text-secondary" />
              </button>
            </div>

            {/* Conteúdo dos Logs */}
            <div className="flex-1 overflow-auto p-6">
              {loadingLogs && (
                <div className="text-center py-12">
                  <RefreshCw size={32} className="mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-text-secondary">Carregando logs...</p>
                </div>
              )}

              {!loadingLogs && podLogs && (
                <div className="bg-black/90 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">{podLogs.logs || 'Nenhum log disponível'}</pre>
                </div>
              )}

              {!loadingLogs && !podLogs && (
                <div className="text-center py-12 text-text-secondary">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Não foi possível carregar os logs</p>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-border bg-background flex justify-end">
              <button
                onClick={closePodLogs}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KubernetesPage
