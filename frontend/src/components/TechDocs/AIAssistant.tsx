import { useState, useEffect, useRef } from 'react'
import { Sparkles, Wand2, MessageSquare, Network, X, Download, Copy, Check, RefreshCw } from 'lucide-react'
import { aiService, AIProvider, Repository, AzureDevOpsProject, TechDocsProgress } from '../../services/aiService'
import styles from './AIAssistant.module.css'

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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <Sparkles size={20} />
          Assistente IA
        </h2>
        {onClose && (
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'generate' ? styles.active : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <Wand2 size={16} />
          Gerar
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'improve' ? styles.active : ''}`}
          onClick={() => setActiveTab('improve')}
        >
          <Sparkles size={16} />
          Melhorar
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'diagram' ? styles.active : ''}`}
          onClick={() => setActiveTab('diagram')}
        >
          <Network size={16} />
          Diagrama
        </button>
      </div>

      <div className={styles.providerSelector}>
        <label>Provedor de IA:</label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          disabled={providers.length === 0}
        >
          {providers.length === 0 && <option>Nenhum provedor configurado</option>}
          {providers.map((p) => (
            <option key={p.provider} value={p.provider}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.content}>
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className={styles.tabContent}>
            <div className={styles.formGroup}>
              <label>Tipo de Documentação:</label>
              <select value={generateDocType} onChange={(e) => setGenerateDocType(e.target.value)}>
                <option value="api">API</option>
                <option value="architecture">Arquitetura</option>
                <option value="guide">Guia</option>
                <option value="readme">README</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Fonte:</label>
              <select value={generateSource} onChange={(e) => setGenerateSource(e.target.value)}>
                <option value="code">Código</option>
                <option value="github">GitHub</option>
                <option value="azuredevops">Azure DevOps</option>
              </select>
            </div>

            {generateSource === 'code' && (
              <>
                <div className={styles.formGroup}>
                  <label>Linguagem:</label>
                  <select value={generateLanguage} onChange={(e) => setGenerateLanguage(e.target.value)}>
                    <option value="go">Go</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Código:</label>
                  <textarea
                    value={generateCode}
                    onChange={(e) => setGenerateCode(e.target.value)}
                    placeholder="Cole seu código aqui..."
                    rows={10}
                  />
                </div>
              </>
            )}

            {generateSource === 'github' && (
              <>
                <div className={styles.formGroup}>
                  <label>Repositório:</label>
                  <div className={styles.inputWithButton}>
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      disabled={loadingRepos}
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
                    <button onClick={loadGitHubRepos} className={styles.iconBtn} title="Recarregar">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={readFullRepo}
                      onChange={(e) => setReadFullRepo(e.target.checked)}
                    />
                    <span>Ler repositório inteiro (todos os arquivos)</span>
                  </label>
                  <div className={styles.info}>
                    <p>
                      ✨ Quando marcado, lerá todos os arquivos do repositório e salvará automaticamente em <strong>ia/{selectedRepo.split('/')[1] || 'repo'}.md</strong>
                    </p>
                  </div>
                </div>

                {!readFullRepo && (
                  <>
                    <div className={styles.formGroup}>
                      <label>Caminho do arquivo (ex: src/main.go):</label>
                      <div className={styles.inputWithButton}>
                        <input
                          type="text"
                          value={repoPath}
                          onChange={(e) => setRepoPath(e.target.value)}
                          placeholder="src/main.go"
                        />
                        <button
                          onClick={loadRepoCode}
                          disabled={!repoPath || loading}
                          className={styles.primaryBtn}
                        >
                          Carregar Código
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Código carregado:</label>
                      <textarea
                        value={generateCode}
                        onChange={(e) => setGenerateCode(e.target.value)}
                        placeholder="Código será carregado automaticamente..."
                        rows={10}
                        readOnly
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {generateSource === 'azuredevops' && (
              <>
                <div className={styles.formGroup}>
                  <label>Projeto:</label>
                  <div className={styles.inputWithButton}>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      disabled={loadingRepos}
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
                    <button onClick={loadAzureProjects} className={styles.iconBtn} title="Recarregar">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.info}>
                  <p>
                    Para Azure DevOps, cole o código manualmente abaixo ou a IA irá gerar documentação baseada no
                    projeto selecionado.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label>Código (opcional):</label>
                  <textarea
                    value={generateCode}
                    onChange={(e) => setGenerateCode(e.target.value)}
                    placeholder="Cole código específico aqui (opcional)..."
                    rows={10}
                  />
                </div>
              </>
            )}

            <button onClick={handleGenerate} disabled={loading} className={styles.primaryBtn}>
              {loading ? 'Gerando...' : 'Gerar Documentação'}
            </button>
          </div>
        )}

        {/* Improve Tab */}
        {activeTab === 'improve' && (
          <div className={styles.tabContent}>
            <div className={styles.formGroup}>
              <label>Tipo de Melhoria:</label>
              <select value={improveType} onChange={(e) => setImproveType(e.target.value)}>
                <option value="complete">Completa (tudo)</option>
                <option value="grammar">Gramática</option>
                <option value="clarity">Clareza</option>
                <option value="structure">Estrutura</option>
              </select>
            </div>

            <div className={styles.info}>
              <p>
                Documento atual: {currentContent ? `${currentContent.length} caracteres` : 'Nenhum documento carregado'}
              </p>
            </div>

            <button onClick={handleImprove} disabled={loading || !currentContent} className={styles.primaryBtn}>
              {loading ? 'Melhorando...' : 'Melhorar Documentação'}
            </button>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className={styles.tabContent}>
            <div className={styles.chatHistory}>
              {chatHistory.length === 0 && (
                <p className={styles.emptyState}>Nenhuma conversa ainda. Faça uma pergunta!</p>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                  <strong>{msg.role === 'user' ? 'Você:' : 'IA:'}</strong>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>

            <div className={styles.chatInput}>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Faça uma pergunta sobre a documentação..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleChat()
                  }
                }}
              />
              <button onClick={handleChat} disabled={loading || !chatMessage.trim()} className={styles.primaryBtn}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}

        {/* Diagram Tab */}
        {activeTab === 'diagram' && (
          <div className={styles.tabContent}>
            <div className={styles.formGroup}>
              <label>Tipo de Diagrama:</label>
              <select value={diagramType} onChange={(e) => setDiagramType(e.target.value)}>
                <option value="architecture">Arquitetura</option>
                <option value="class">Classes</option>
                <option value="sequence">Sequência</option>
                <option value="flowchart">Fluxograma</option>
                <option value="erd">ER Diagram</option>
                <option value="component">Componentes</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Fonte:</label>
              <select value={diagramSource} onChange={(e) => setDiagramSource(e.target.value)}>
                <option value="code">Código</option>
                <option value="description">Descrição</option>
              </select>
            </div>

            {diagramSource === 'code' && (
              <>
                <div className={styles.formGroup}>
                  <label>Linguagem:</label>
                  <select value={diagramLanguage} onChange={(e) => setDiagramLanguage(e.target.value)}>
                    <option value="go">Go</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Código:</label>
                  <textarea
                    value={diagramCode}
                    onChange={(e) => setDiagramCode(e.target.value)}
                    placeholder="Cole seu código aqui..."
                    rows={10}
                  />
                </div>
              </>
            )}

            <button onClick={handleGenerateDiagram} disabled={loading} className={styles.primaryBtn}>
              {loading ? 'Gerando...' : 'Gerar Diagrama'}
            </button>
          </div>
        )}

        {generationProgress && (
          <div
            className={`${styles.progressPanel} ${
              generationProgress.status === 'failed' ? styles.progressPanelError : ''
            }`}
          >
            <div className={styles.progressHeader}>
              <div>
                <strong>Progresso da documentação</strong>
                <span>{generationProgress.message}</span>
              </div>
              <span className={styles.progressValue}>{generationProgress.percent}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${generationProgress.percent}%` }}
              />
            </div>
            <div className={styles.progressDetails}>
              <span className={styles.progressStatus}>{getStatusLabel(generationProgress.status)}</span>
              {generationProgress.totalChunks > 0 && (
                <span>
                  {generationProgress.chunk}/{generationProgress.totalChunks} blocos
                </span>
              )}
              <span>ID: {generationProgress.id}</span>
            </div>
            {generationProgress.status === 'failed' && generationProgress.errorMessage && (
              <p className={styles.progressErrorText}>{generationProgress.errorMessage}</p>
            )}
          </div>
        )}

        {/* Result Area */}
        {result && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <h3>Resultado</h3>
              <div className={styles.resultActions}>
                {activeTab === 'diagram' && (
                  <button onClick={handleDownloadDiagram} className={styles.iconBtn} title="Download .drawio">
                    <Download size={18} />
                  </button>
                )}
                <button onClick={handleCopy} className={styles.iconBtn} title="Copiar">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                {onInsertContent && activeTab !== 'diagram' && (
                  <button onClick={() => onInsertContent(result)} className={styles.primaryBtn}>
                    Inserir no Editor
                  </button>
                )}
              </div>
            </div>
            <pre className={styles.resultContent}>{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIAssistant
