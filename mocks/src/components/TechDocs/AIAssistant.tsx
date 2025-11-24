import { useState, useEffect, useRef } from 'react'
import { Sparkles, Wand2, MessageSquare, Network, X, Download, Copy, Check, RefreshCw } from 'lucide-react'
import { aiService, AIProvider, Repository, AzureDevOpsProject, TechDocsProgress } from '../../services/aiService'

interface AIAssistantProps {
  currentContent?: string
  onInsertContent?: (content: string) => void
  onClose?: () => void
}

type TabType = 'generate' | 'improve' | 'chat' | 'diagram'

const TECHDOCS_PROGRESS_STORAGE_KEY = 'platifyx-techdocs-progress'

function AIAssistant({ currentContent, onInsertContent, onClose }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<TabType>('generate')
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  // Generate tab
  const [generateSource, setGenerateSource] = useState('code')
  const [generateCode, setGenerateCode] = useState('')
  const [generateLanguage, setGenerateLanguage] = useState('go')
  const [generateDocType, setGenerateDocType] = useState('api')
  const [githubRepos, setGithubRepos] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [azureProjects, setAzureProjects] = useState<AzureDevOpsProject[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [readFullRepo, setReadFullRepo] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<TechDocsProgress | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Improve tab
  const [improveType, setImproveType] = useState('complete')

  // Chat tab
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])

  // Diagram tab
  const [diagramType, setDiagramType] = useState('architecture')
  const [diagramSource, setDiagramSource] = useState('code')
  const [diagramCode, setDiagramCode] = useState('')
  const [diagramLanguage, setDiagramLanguage] = useState('go')

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    if (generateSource === 'github') {
      loadGitHubRepos()
    } else if (generateSource === 'azuredevops') {
      loadAzureProjects()
    }
  }, [generateSource])

  const persistProgressId = (id: string) => {
    localStorage.setItem(TECHDOCS_PROGRESS_STORAGE_KEY, id)
  }

  const clearPersistedProgress = () => {
    localStorage.removeItem(TECHDOCS_PROGRESS_STORAGE_KEY)
  }

  const stopProgressPolling = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const fetchProgress = async (progressId: string, silent = false) => {
    try {
      const latest = await aiService.getDocumentationProgress(progressId)
      setGenerationProgress(latest)

      if (latest.status === 'completed') {
        setResult(latest.resultContent || '')
        if (latest.savePath) {
          alert(`Documentação gerada e salva em: ${latest.savePath}`)
        }
        setLoading(false)
        stopProgressPolling()
        clearPersistedProgress()
        setGenerationProgress(null)
        return
      }

      if (latest.status === 'failed') {
        setLoading(false)
        stopProgressPolling()
        clearPersistedProgress()
        if (latest.errorMessage) {
          alert(latest.errorMessage)
        } else if (!silent) {
          alert('Falha ao gerar documentação')
        }
        return
      }
    } catch (err) {
      console.error('Error fetching documentation progress:', err)
      if (!silent) {
        alert('Não foi possível consultar o progresso atual. Tente novamente.')
      }
      setLoading(false)
      stopProgressPolling()
      clearPersistedProgress()
      setGenerationProgress(null)
    }
  }

  const startProgressPolling = (progressId: string) => {
    stopProgressPolling()
    progressIntervalRef.current = window.setInterval(() => {
      fetchProgress(progressId, true)
    }, 3000)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Na fila'
      case 'running':
        return 'Processando'
      case 'failed':
        return 'Falhou'
      case 'completed':
        return 'Concluído'
      default:
        return status
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(TECHDOCS_PROGRESS_STORAGE_KEY)
    if (stored) {
      setLoading(true)
      fetchProgress(stored)
      startProgressPolling(stored)
    }
    return () => stopProgressPolling()
  }, [])

  const loadProviders = async () => {
    try {
      const data = await aiService.getProviders()
      setProviders(data)
      if (data.length > 0) {
        setSelectedProvider(data[0].provider)
      }
    } catch (err) {
      console.error('Error loading providers:', err)
    }
  }

  const loadGitHubRepos = async () => {
    setLoadingRepos(true)
    try {
      const repos = await aiService.getGitHubRepositories()
      setGithubRepos(repos)
      if (repos.length > 0) {
        setSelectedRepo(repos[0].fullName)
      }
    } catch (err) {
      console.error('Error loading GitHub repos:', err)
      alert('Erro ao carregar repositórios do GitHub. Verifique se a integração está configurada.')
    } finally {
      setLoadingRepos(false)
    }
  }

  const loadAzureProjects = async () => {
    setLoadingRepos(true)
    try {
      const projects = await aiService.getAzureDevOpsProjects()
      setAzureProjects(projects)
      if (projects.length > 0) {
        setSelectedProject(projects[0].name)
      }
    } catch (err) {
      console.error('Error loading Azure DevOps projects:', err)
      alert('Erro ao carregar projetos do Azure DevOps. Verifique se a integração está configurada.')
    } finally {
      setLoadingRepos(false)
    }
  }

  const loadRepoCode = async () => {
    if (generateSource === 'github' && selectedRepo && repoPath) {
      setLoading(true)
      try {
        const [owner, repo] = selectedRepo.split('/')
        const code = await aiService.getGitHubRepoContent(owner, repo, repoPath)
        setGenerateCode(code)
      } catch (err: any) {
        alert(`Erro ao carregar código: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleGenerate = async () => {
    if (!selectedProvider) {
      alert('Selecione um provedor de IA')
      return
    }

    if (generationProgress && generationProgress.status !== 'failed' && generationProgress.status !== 'completed') {
      alert('Já existe uma geração em andamento. Acompanhe o progresso ou aguarde finalizar.')
      return
    }

    setLoading(true)
    setResult('')
    setGenerationProgress(null)

    try {
      const request: any = {
        provider: selectedProvider,
        source: generateSource,
        docType: generateDocType,
      }

      if (generateSource === 'code') {
        request.code = generateCode
        request.language = generateLanguage
      } else if (generateSource === 'github') {
        request.repoURL = selectedRepo
        request.readFullRepo = readFullRepo

        // If reading full repo, set save path to ia/reponame.md
        if (readFullRepo) {
          const repoName = selectedRepo.split('/')[1] || 'repo'
          request.savePath = `ia/${repoName}.md`
        } else {
          request.sourcePath = repoPath
          request.code = generateCode
        }
      } else if (generateSource === 'azuredevops') {
        request.projectName = selectedProject
        request.code = generateCode
      }

      const progress = await aiService.generateDocumentation(request)
      if (!progress || !progress.id) {
        throw new Error('Não foi possível iniciar a geração')
      }

      setGenerationProgress(progress)
      persistProgressId(progress.id)
      fetchProgress(progress.id, true)
      startProgressPolling(progress.id)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
      setLoading(false)
    }
  }

  const handleImprove = async () => {
    if (!selectedProvider || !currentContent) {
      alert('Selecione um provedor de IA e carregue um documento')
      return
    }

    setLoading(true)
    setResult('')

    try {
      const response = await aiService.improveDocumentation({
        provider: selectedProvider,
        content: currentContent,
        improvementType: improveType,
      })

      setResult(response.content)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    if (!selectedProvider || !chatMessage.trim()) {
      alert('Digite uma mensagem')
      return
    }

    setLoading(true)

    try {
      const response = await aiService.chat({
        provider: selectedProvider,
        message: chatMessage,
        context: currentContent || '',
        conversation: chatHistory,
      })

      setChatHistory([
        ...chatHistory,
        { role: 'user', content: chatMessage },
        { role: 'assistant', content: response.content },
      ])
      setChatMessage('')
      setResult(response.content)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDiagram = async () => {
    if (!selectedProvider) {
      alert('Selecione um provedor de IA')
      return
    }

    setLoading(true)
    setResult('')

    try {
      const response = await aiService.generateDiagram({
        provider: selectedProvider,
        diagramType,
        source: diagramSource,
        code: diagramCode,
        language: diagramLanguage,
      })

      setResult(response.content)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadDiagram = () => {
    const blob = new Blob([result], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagram-${diagramType}-${Date.now()}.drawio`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text">
          <Sparkles size={20} />
          Assistente IA
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-hover rounded-lg transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex border-b border-border">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'generate'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('generate')}
        >
          <Wand2 size={16} />
          Gerar
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'improve'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('improve')}
        >
          <Sparkles size={16} />
          Melhorar
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'diagram'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('diagram')}
        >
          <Network size={16} />
          Diagrama
        </button>
      </div>

      <div className="p-4 border-b border-border">
        <label className="block text-sm font-medium text-text mb-2">Provedor de IA:</label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          disabled={providers.length === 0}
          className="w-full p-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {providers.length === 0 && <option>Nenhum provedor configurado</option>}
          {providers.map((p) => (
            <option key={p.provider} value={p.provider}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Tipo de Documentação:</label>
              <select value={generateDocType} onChange={(e) => setGenerateDocType(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                <option value="api">API</option>
                <option value="architecture">Arquitetura</option>
                <option value="guide">Guia</option>
                <option value="readme">README</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Fonte:</label>
              <select value={generateSource} onChange={(e) => setGenerateSource(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                <option value="code">Código</option>
                <option value="github">GitHub</option>
                <option value="azuredevops">Azure DevOps</option>
              </select>
            </div>

            {generateSource === 'code' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Linguagem:</label>
                  <select value={generateLanguage} onChange={(e) => setGenerateLanguage(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                    <option value="go">Go</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Código:</label>
                  <textarea
                    value={generateCode}
                    onChange={(e) => setGenerateCode(e.target.value)}
                    placeholder="Cole seu código aqui..."
                    rows={10}
                    className="w-full p-3 bg-background border border-border rounded-lg text-text font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {generateSource === 'github' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Repositório:</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      disabled={loadingRepos}
                      className="flex-1 p-2 bg-background border border-border rounded-lg text-text"
                    >
                      {loadingRepos && <option>Carregando...</option>}
                      {!loadingRepos && githubRepos.length === 0 && (
                        <option>Nenhum repositório encontrado</option>
                      )}
                      {githubRepos.map((repo) => (
                        <option key={repo.fullName} value={repo.fullName}>
                          {repo.fullName}
                        </option>
                      ))}
                    </select>
                    <button onClick={loadGitHubRepos} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" title="Recarregar">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readFullRepo}
                      onChange={(e) => setReadFullRepo(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-text">Ler repositório inteiro (todos os arquivos)</span>
                  </label>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    <p>
                      ✨ Quando marcado, lerá todos os arquivos do repositório e salvará automaticamente em <strong>ia/{selectedRepo.split('/')[1] || 'repo'}.md</strong>
                    </p>
                  </div>
                </div>

                {!readFullRepo && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Caminho do arquivo (ex: src/main.go):</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={repoPath}
                          onChange={(e) => setRepoPath(e.target.value)}
                          placeholder="src/main.go"
                          className="flex-1 p-2 bg-background border border-border rounded-lg text-text"
                        />
                        <button
                          onClick={loadRepoCode}
                          disabled={!repoPath || loading}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                        >
                          Carregar Código
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Código carregado:</label>
                      <textarea
                        value={generateCode}
                        onChange={(e) => setGenerateCode(e.target.value)}
                        placeholder="Código será carregado automaticamente..."
                        rows={10}
                        readOnly
                        className="w-full p-3 bg-background border border-border rounded-lg text-text font-mono text-sm resize-none"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {generateSource === 'azuredevops' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Projeto:</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      disabled={loadingRepos}
                      className="flex-1 p-2 bg-background border border-border rounded-lg text-text"
                    >
                      {loadingRepos && <option>Carregando...</option>}
                      {!loadingRepos && azureProjects.length === 0 && (
                        <option>Nenhum projeto encontrado</option>
                      )}
                      {azureProjects.map((project) => (
                        <option key={project.id} value={project.name}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={loadAzureProjects} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" title="Recarregar">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                  <p>
                    Para Azure DevOps, cole o código manualmente abaixo ou a IA irá gerar documentação baseada no
                    projeto selecionado.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Código (opcional):</label>
                  <textarea
                    value={generateCode}
                    onChange={(e) => setGenerateCode(e.target.value)}
                    placeholder="Cole código específico aqui (opcional)..."
                    rows={10}
                    className="w-full p-3 bg-background border border-border rounded-lg text-text font-mono text-sm resize-none"
                  />
                </div>
              </>
            )}

            <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium">
              {loading ? 'Gerando...' : 'Gerar Documentação'}
            </button>
          </div>
        )}

        {/* Improve Tab */}
        {activeTab === 'improve' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Tipo de Melhoria:</label>
              <select value={improveType} onChange={(e) => setImproveType(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                <option value="complete">Completa (tudo)</option>
                <option value="grammar">Gramática</option>
                <option value="clarity">Clareza</option>
                <option value="structure">Estrutura</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p>
                Documento atual: {currentContent ? `${currentContent.length} caracteres` : 'Nenhum documento carregado'}
              </p>
            </div>

            <button onClick={handleImprove} disabled={loading || !currentContent} className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium">
              {loading ? 'Melhorando...' : 'Melhorar Documentação'}
            </button>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto border border-border rounded-lg p-4 bg-background space-y-3">
              {chatHistory.length === 0 && (
                <p className="text-center text-text-secondary">Nenhuma conversa ainda. Faça uma pergunta!</p>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-surface mr-8'}`}>
                  <strong className="text-text">{msg.role === 'user' ? 'Você:' : 'IA:'}</strong>
                  <p className="text-text mt-1">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Faça uma pergunta sobre a documentação..."
                rows={3}
                className="flex-1 p-3 bg-background border border-border rounded-lg text-text resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleChat()
                  }
                }}
              />
              <button onClick={handleChat} disabled={loading || !chatMessage.trim()} className="px-6 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium">
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}

        {/* Diagram Tab */}
        {activeTab === 'diagram' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Tipo de Diagrama:</label>
              <select value={diagramType} onChange={(e) => setDiagramType(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                <option value="architecture">Arquitetura</option>
                <option value="class">Classes</option>
                <option value="sequence">Sequência</option>
                <option value="flowchart">Fluxograma</option>
                <option value="erd">ER Diagram</option>
                <option value="component">Componentes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Fonte:</label>
              <select value={diagramSource} onChange={(e) => setDiagramSource(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                <option value="code">Código</option>
                <option value="description">Descrição</option>
              </select>
            </div>

            {diagramSource === 'code' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Linguagem:</label>
                  <select value={diagramLanguage} onChange={(e) => setDiagramLanguage(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg text-text">
                    <option value="go">Go</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Código:</label>
                  <textarea
                    value={diagramCode}
                    onChange={(e) => setDiagramCode(e.target.value)}
                    placeholder="Cole seu código aqui..."
                    rows={10}
                    className="w-full p-3 bg-background border border-border rounded-lg text-text font-mono text-sm resize-none"
                  />
                </div>
              </>
            )}

            <button onClick={handleGenerateDiagram} disabled={loading} className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-medium">
              {loading ? 'Gerando...' : 'Gerar Diagrama'}
            </button>
          </div>
        )}

        {generationProgress && (
          <div
            className={`p-4 rounded-lg border ${
              generationProgress.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <strong className="text-text">Progresso da documentação</strong>
                <span className="block text-sm text-text-secondary">{generationProgress.message}</span>
              </div>
              <span className="text-lg font-bold text-text">{generationProgress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${generationProgress.percent}%` }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-sm text-text-secondary">
              <span>{getStatusLabel(generationProgress.status)}</span>
              {generationProgress.totalChunks > 0 && (
                <span>
                  {generationProgress.chunk}/{generationProgress.totalChunks} blocos
                </span>
              )}
              <span>ID: {generationProgress.id}</span>
            </div>
            {generationProgress.status === 'failed' && generationProgress.errorMessage && (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">{generationProgress.errorMessage}</p>
            )}
          </div>
        )}

        {/* Result Area */}
        {result && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 bg-surface border-b border-border">
              <h3 className="font-medium text-text">Resultado</h3>
              <div className="flex gap-2">
                {activeTab === 'diagram' && (
                  <button onClick={handleDownloadDiagram} className="p-2 hover:bg-hover rounded-lg transition-colors" title="Download .drawio">
                    <Download size={18} />
                  </button>
                )}
                <button onClick={handleCopy} className="p-2 hover:bg-hover rounded-lg transition-colors" title="Copiar">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                {onInsertContent && activeTab !== 'diagram' && (
                  <button onClick={() => onInsertContent(result)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium">
                    Inserir no Editor
                  </button>
                )}
              </div>
            </div>
            <pre className="p-4 bg-background text-text font-mono text-sm overflow-x-auto whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIAssistant
