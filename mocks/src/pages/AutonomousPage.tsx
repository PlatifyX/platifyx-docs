import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  MessageSquare, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Server,
  Loader2,
  Send,
  Settings,
  PlayCircle
} from 'lucide-react'
import { buildApiUrl } from '../config/api'

interface Recommendation {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reason: string
  action: string
  impact: string
  confidence: number
  metadata?: Record<string, any>
  createdAt: string
  expiresAt?: string
}

interface TroubleshootingResponse {
  answer: string
  confidence: number
  rootCause: string
  solution: string
  evidence: string[]
  relatedLogs?: string[]
  relatedMetrics?: Record<string, any>
  actions?: RecommendedAction[]
}

interface RecommendedAction {
  type: string
  description: string
  command?: string
  apiEndpoint?: string
  parameters?: Record<string, any>
  autoExecute: boolean
}

interface AutonomousAction {
  id: string
  type: string
  status: string
  description: string
  trigger: string
  action: RecommendedAction
  result?: Record<string, any>
  error?: string
  createdAt: string
  executedAt?: string
  executedBy: string
}

interface AutonomousConfig {
  enabled: boolean
  autoExecute: boolean
  requireApproval: boolean
  allowedActions: string[]
  notificationChannels: string[]
}

type TabType = 'recommendations' | 'troubleshooting' | 'actions'

function AutonomousPage() {
  const [activeTab, setActiveTab] = useState<TabType>('recommendations')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [troubleshootingQuestion, setTroubleshootingQuestion] = useState('')
  const [troubleshootingResponse, setTroubleshootingResponse] = useState<TroubleshootingResponse | null>(null)
  const [troubleshootingLoading, setTroubleshootingLoading] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [namespace, setNamespace] = useState('')
  const [actions, setActions] = useState<AutonomousAction[]>([])
  const [config, setConfig] = useState<AutonomousConfig | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    fetchRecommendations()
    fetchConfig()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl('autonomous/recommendations'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch(buildApiUrl('autonomous/actions/config'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const handleTroubleshoot = async () => {
    if (!troubleshootingQuestion.trim()) return

    try {
      setTroubleshootingLoading(true)
      const response = await fetch(buildApiUrl('autonomous/troubleshoot'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: troubleshootingQuestion,
          serviceName: serviceName || undefined,
          namespace: namespace || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTroubleshootingResponse(data)
      }
    } catch (error) {
      console.error('Failed to troubleshoot:', error)
    } finally {
      setTroubleshootingLoading(false)
    }
  }

  const executeAction = async (recommendation: Recommendation) => {
    if (!config?.enabled) {
      alert('Ações autonômicas estão desabilitadas. Habilite nas configurações.')
      return
    }

    const actionType = recommendation.type === 'deployment' ? 'rollback' : 'scale'
    const action: RecommendedAction = {
      type: actionType,
      description: recommendation.action,
      parameters: recommendation.metadata || {},
      autoExecute: config.autoExecute && !config.requireApproval
    }

    try {
      const response = await fetch(buildApiUrl('autonomous/actions/execute'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(action)
      })

      if (response.ok) {
        const data = await response.json()
        setActions(prev => [data, ...prev])
        alert(`Ação ${data.status === 'completed' ? 'executada' : 'criada'} com sucesso!`)
        fetchRecommendations()
      }
    } catch (error) {
      console.error('Failed to execute action:', error)
      alert('Falha ao executar ação')
    }
  }

  const updateConfig = async (newConfig: AutonomousConfig) => {
    try {
      const response = await fetch(buildApiUrl('autonomous/actions/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newConfig)
      })

      if (response.ok) {
        setConfig(newConfig)
        setShowConfig(false)
        alert('Configuração atualizada com sucesso!')
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      alert('Falha ao atualizar configuração')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/10'
      case 'high': return 'border-orange-500 bg-orange-500/10'
      case 'medium': return 'border-yellow-500 bg-yellow-500/10'
      case 'low': return 'border-blue-500 bg-blue-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="text-red-500" size={20} />
      case 'high': return <AlertTriangle className="text-orange-500" size={20} />
      case 'medium': return <AlertTriangle className="text-yellow-500" size={20} />
      case 'low': return <CheckCircle className="text-blue-500" size={20} />
      default: return <AlertTriangle className="text-gray-500" size={20} />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deployment': return <Server size={18} />
      case 'cost': return <DollarSign size={18} />
      case 'security': return <AlertTriangle size={18} />
      case 'performance': return <TrendingUp size={18} />
      default: return <AlertTriangle size={18} />
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Engenharia Inteligente</h1>
        <p className="text-gray-400">Recomendações automáticas, troubleshooting com IA e ações autonômicas</p>
      </div>

      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            className={`py-4 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'recommendations'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('recommendations')}
          >
            <AlertTriangle size={18} />
            Recomendações
            {recommendations.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {recommendations.filter(r => r.severity === 'high' || r.severity === 'critical').length}
              </span>
            )}
          </button>
          <button
            className={`py-4 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'troubleshooting'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('troubleshooting')}
          >
            <MessageSquare size={18} />
            Troubleshooting
          </button>
          <button
            className={`py-4 px-2 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'actions'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('actions')}
          >
            <Zap size={18} />
            Ações Autonômicas
          </button>
          <button
            className="ml-auto py-4 px-2 text-gray-400 hover:text-gray-300"
            onClick={() => setShowConfig(true)}
          >
            <Settings size={18} />
          </button>
        </nav>
      </div>

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#1B998B]" size={32} />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-12 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
              <p className="text-gray-400 text-lg">Nenhuma recomendação no momento</p>
              <p className="text-gray-500 text-sm mt-2">Tudo está funcionando perfeitamente!</p>
            </div>
          ) : (
            <>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`bg-[#1E1E1E] border-2 rounded-lg p-6 ${getSeverityColor(rec.severity)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(rec.severity)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(rec.type)}
                          <h3 className="text-xl font-bold text-white">{rec.title}</h3>
                          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 capitalize">
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{rec.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Confiança: {(rec.confidence * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>Impacto: {rec.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2A2A2A] rounded-lg p-4 mb-4">
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-gray-400">Motivo:</span>
                      <p className="text-gray-200">{rec.reason}</p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-400">Ação Recomendada:</span>
                      <p className="text-gray-200">{rec.action}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {config?.enabled && (
                      <button
                        onClick={() => executeAction(rec)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg transition-colors"
                      >
                        <PlayCircle size={16} />
                        Executar Ação
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveTab('troubleshooting')
                        setTroubleshootingQuestion(`Explique mais sobre: ${rec.title}`)
                        setServiceName(rec.metadata?.deployment || '')
                        setNamespace(rec.metadata?.namespace || '')
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <MessageSquare size={16} />
                      Perguntar à IA
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'troubleshooting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare size={24} />
                Assistente de Troubleshooting
              </h3>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Serviço (opcional)</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Nome do serviço"
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Namespace (opcional)</label>
                  <input
                    type="text"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="Namespace do Kubernetes"
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sua Pergunta</label>
                  <textarea
                    value={troubleshootingQuestion}
                    onChange={(e) => setTroubleshootingQuestion(e.target.value)}
                    placeholder="Ex: Por que meu deployment está falhando?"
                    rows={4}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleTroubleshoot()
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Ctrl+Enter para enviar</p>
                </div>
                <button
                  onClick={handleTroubleshoot}
                  disabled={troubleshootingLoading || !troubleshootingQuestion.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {troubleshootingLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar Pergunta
                    </>
                  )}
                </button>
              </div>
            </div>

            {troubleshootingResponse && (
              <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Resposta da IA</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-400">Causa Raiz:</span>
                    <p className="text-gray-200 mt-1">{troubleshootingResponse.rootCause}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-400">Solução:</span>
                    <p className="text-gray-200 mt-1">{troubleshootingResponse.solution}</p>
                  </div>
                  {troubleshootingResponse.evidence.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-400">Evidências:</span>
                      <ul className="list-disc list-inside text-gray-300 mt-1 space-y-1">
                        {troubleshootingResponse.evidence.map((evidence, idx) => (
                          <li key={idx}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {troubleshootingResponse.actions && troubleshootingResponse.actions.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-400">Ações Sugeridas:</span>
                      <div className="mt-2 space-y-2">
                        {troubleshootingResponse.actions.map((action, idx) => (
                          <div key={idx} className="bg-[#2A2A2A] rounded-lg p-3">
                            <p className="text-gray-200 mb-1">{action.description}</p>
                            {action.command && (
                              <code className="text-xs text-gray-400 bg-[#1E1E1E] px-2 py-1 rounded block mt-2">
                                {action.command}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4">
              <h4 className="font-bold mb-2">Perguntas Sugeridas</h4>
              <div className="space-y-2">
                {[
                  'Por que meu deployment está falhando?',
                  'Como resolver ImagePullBackOff?',
                  'Por que os pods não estão ficando prontos?',
                  'Como investigar um crash loop?'
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTroubleshootingQuestion(question)
                      handleTroubleshoot()
                    }}
                    className="w-full text-left text-sm text-gray-300 hover:text-white hover:bg-[#2A2A2A] px-3 py-2 rounded transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Ações Autonômicas</h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded ${config?.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {config?.enabled ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Zap className="mx-auto mb-4 opacity-50" size={48} />
                <p>Nenhuma ação executada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.id} className="bg-[#2A2A2A] rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {action.status === 'completed' && <CheckCircle className="text-green-400" size={18} />}
                          {action.status === 'failed' && <XCircle className="text-red-400" size={18} />}
                          {action.status === 'pending' && <Clock className="text-yellow-400" size={18} />}
                          <span className="font-semibold text-white">{action.description}</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Tipo: {action.type} • Status: {action.status}
                        </p>
                        {action.error && (
                          <p className="text-sm text-red-400 mt-2">Erro: {action.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showConfig && config && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Configurações</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Habilitar ações autonômicas</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.autoExecute}
                  onChange={(e) => setConfig({ ...config, autoExecute: e.target.checked })}
                  className="w-4 h-4"
                  disabled={!config.enabled}
                />
                <span>Executar automaticamente</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.requireApproval}
                  onChange={(e) => setConfig({ ...config, requireApproval: e.target.checked })}
                  className="w-4 h-4"
                  disabled={!config.enabled || !config.autoExecute}
                />
                <span>Requerer aprovação</span>
              </label>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => updateConfig(config)}
                  className="flex-1 px-4 py-2 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutonomousPage

