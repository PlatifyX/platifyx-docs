import { useState } from 'react'
import { Zap, Loader2, CheckCircle, AlertCircle, Code, GitBranch, BarChart3, Bell, DollarSign, Link, FileText, Target } from 'lucide-react'
import { buildApiUrl } from '../config/api'

function ServicePlaybookPage() {
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceType: 'api',
    language: 'go',
    framework: '',
    description: '',
    team: '',
    repositoryUrl: '',
    repositorySource: 'github',
    namespace: 'default',
    environment: 'development',
    replicas: 1
  })

  const handleCreateService = async () => {
    if (!formData.serviceName || !formData.serviceType || !formData.language) {
      alert('Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      setCreating(true)
      const response = await fetch(buildApiUrl('playbook/service/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create service')

      const progressData = await response.json()
      setProgress(progressData)

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(buildApiUrl(`playbook/service/progress/${progressData.id}`), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (progressResponse.ok) {
            const updatedProgress = await progressResponse.json()
            setProgress(updatedProgress)

            if (updatedProgress.status === 'completed' || updatedProgress.status === 'failed') {
              clearInterval(pollInterval)
              setCreating(false)
            }
          }
        } catch (err) {
          console.error('Error polling progress:', err)
        }
      }, 2000)

      // Cleanup after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setCreating(false)
      }, 10 * 60 * 1000)
    } catch (err) {
      console.error('Error creating service:', err)
      alert('Erro ao criar serviço')
      setCreating(false)
    }
  }

  const getArtifactIcon = (key: string) => {
    const icons: Record<string, any> = {
      code: Code,
      pipeline: GitBranch,
      dashboard: BarChart3,
      alerts: Bell,
      costPanel: DollarSign,
      dependencies: Link,
      portalIntegration: Link,
      documentation: FileText
    }
    return icons[key] || CheckCircle
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Playbooks Operáveis</h1>
        <p className="text-gray-400">Crie serviços completos com um clique - código, pipeline, dashboards, alertas e muito mais</p>
      </div>

      {!showForm && !progress && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="bg-gradient-to-br from-[#1B998B] to-[#15887a] rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Zap size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Criar Novo Serviço</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Um clique e você terá um serviço completo rodando com código, pipeline, dashboards, alertas, painéis de custo e documentação.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg font-semibold text-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Zap size={24} />
              Criar Serviço
            </button>
          </div>
        </div>
      )}

      {showForm && !progress && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-6">Informações do Serviço</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Serviço *</label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  placeholder="ex: api-gateway"
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#1B998B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Serviço *</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white outline-none focus:border-[#1B998B]"
                >
                  <option value="api">API</option>
                  <option value="frontend">Frontend</option>
                  <option value="worker">Worker</option>
                  <option value="cronjob">CronJob</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Linguagem *</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white outline-none focus:border-[#1B998B]"
                >
                  <option value="go">Go</option>
                  <option value="node">Node.js</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Framework (opcional)</label>
                <input
                  type="text"
                  value={formData.framework}
                  onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                  placeholder="ex: Gin, Express, Flask"
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#1B998B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  placeholder="ex: Backend Team"
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#1B998B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ambiente</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white outline-none focus:border-[#1B998B]"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Namespace</label>
                <input
                  type="text"
                  value={formData.namespace}
                  onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                  placeholder="default"
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#1B998B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Réplicas</label>
                <input
                  type="number"
                  value={formData.replicas}
                  onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white outline-none focus:border-[#1B998B]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço..."
                rows={3}
                className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#1B998B] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL do Repositório (opcional)</label>
                <input
                  type="text"
                  value={formData.repositoryUrl}
                  onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                  placeholder="https://github.com/owner/repo"
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-500 outline-none focus:border-[#1B998B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fonte do Repositório</label>
                <select
                  value={formData.repositorySource}
                  onChange={(e) => setFormData({ ...formData, repositorySource: e.target.value })}
                  className="w-full py-2 px-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white outline-none focus:border-[#1B998B]"
                >
                  <option value="github">GitHub</option>
                  <option value="azuredevops">Azure DevOps</option>
                  <option value="gitlab">GitLab</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateService}
                disabled={creating || !formData.serviceName}
                className="flex-1 px-6 py-3 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Criando...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Criar Serviço Completo
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    serviceName: '',
                    serviceType: 'api',
                    language: 'go',
                    framework: '',
                    description: '',
                    team: '',
                    repositoryUrl: '',
                    repositorySource: 'github',
                    namespace: 'default',
                    environment: 'development',
                    replicas: 1
                  })
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {progress && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Criação do Serviço: {progress.serviceName}</h2>
              {progress.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={24} />
                  <span className="font-semibold">Concluído!</span>
                </div>
              )}
              {progress.status === 'failed' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={24} />
                  <span className="font-semibold">Falhou</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Progresso</span>
                <span className="text-[#1B998B] font-bold">{progress.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progress.status === 'completed' ? 'bg-green-500' :
                    progress.status === 'failed' ? 'bg-red-500' : 'bg-[#1B998B]'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{progress.currentStep}</p>
            </div>

            {progress.status === 'completed' && progress.maturityScore !== undefined && (
              <div className="bg-gradient-to-r from-[#1B998B]/20 to-[#15887a]/20 border border-[#1B998B]/30 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="text-[#1B998B]" size={32} />
                  <div>
                    <h3 className="text-2xl font-bold text-white">Score de Maturidade</h3>
                    <p className="text-gray-400 text-sm">Seu serviço nasceu com</p>
                  </div>
                </div>
                <div className="text-5xl font-bold text-[#1B998B] mb-2">
                  {progress.maturityScore.toFixed(1)}/10
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-[#1B998B] h-4 rounded-full transition-all"
                    style={{ width: `${(progress.maturityScore / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {progress.created && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(progress.created).map(([key, value]: [string, any]) => {
                  if (key === 'artifacts' || key === 'maturityScore') return null
                  if (!value) return null
                  
                  const Icon = getArtifactIcon(key)
                  return (
                    <div key={key} className="bg-[#2A2A2A] rounded-lg p-3 flex items-center gap-2">
                      <Icon className="text-green-400" size={20} />
                      <span className="text-white text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {progress.errors && progress.errors.length > 0 && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-semibold mb-2">Avisos:</h4>
                {progress.errors.map((error: string, idx: number) => (
                  <p key={idx} className="text-red-300 text-sm">{error}</p>
                ))}
              </div>
            )}

            {progress.status === 'completed' && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setProgress(null)
                    setShowForm(false)
                    setFormData({
                      serviceName: '',
                      serviceType: 'api',
                      language: 'go',
                      framework: '',
                      description: '',
                      team: '',
                      repositoryUrl: '',
                      repositorySource: 'github',
                      namespace: 'default',
                      environment: 'development',
                      replicas: 1
                    })
                  }}
                  className="px-6 py-3 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg font-semibold transition-colors"
                >
                  Criar Outro Serviço
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServicePlaybookPage

