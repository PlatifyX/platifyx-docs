import { useState, useEffect } from 'react'
import { Github, AlertCircle, RefreshCw, ExternalLink, Star, GitFork } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import IntegrationSelector from '../components/Common/IntegrationSelector'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  private: boolean
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  language: string
  forks_count: number
  open_issues_count: number
  default_branch: string
  owner: {
    login: string
    avatar_url: string
  }
}

interface Stats {
  totalRepositories: number
  totalStars: number
  totalForks: number
  totalOpenIssues: number
  publicRepos: number
  privateRepos: number
}

function GitHubPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'repositories'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')

  const [stats, setStats] = useState<Stats | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'overview') {
        const params = new URLSearchParams()
        if (selectedIntegration) params.append('integration', selectedIntegration)
        const statsRes = await fetch(buildApiUrl(`code/stats?${params.toString()}`))
        if (!statsRes.ok) {
          // 404 = sem integração configurada
          if (statsRes.status === 404) {
            setStats(null)
            setRepositories([])
            setError(null)
          } else {
            // Outros erros (503, 500, etc.) = problema no serviço
            setError(`Erro ao buscar estatísticas do GitHub (${statsRes.status})`)
            setStats(null)
            setRepositories([])
          }
          setLoading(false)
          return
        }
        const data = await statsRes.json()
        setStats(data)
      }

      if (activeTab === 'repositories' || activeTab === 'overview') {
        const params = new URLSearchParams()
        if (selectedIntegration) params.append('integration', selectedIntegration)
        const reposRes = await fetch(buildApiUrl(`code/repositories?${params.toString()}`))
        if (!reposRes.ok) {
          // 404 = sem integração configurada
          if (reposRes.status === 404) {
            setRepositories([])
            if (activeTab === 'repositories') {
              setStats(null)
              setError(null)
              setLoading(false)
              return
            }
          } else {
            // Outros erros (503, 500, etc.) = problema no serviço
            setError(`Erro ao buscar repositórios (${reposRes.status})`)
            setRepositories([])
            if (activeTab === 'repositories') {
              setLoading(false)
              return
            }
          }
        } else {
          const data = await reposRes.json()
          setRepositories(data.repositories || [])
        }
      }
    } catch (err: any) {
      // Erro de rede ou outros erros
      setError(`Erro de conexão: ${err.message || 'Não foi possível conectar ao backend'}`)
      setStats(null)
      setRepositories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedIntegration])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const renderOverview = () => (
    <div className="animate-fade-in">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-8">
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <Github size={24} className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary" />
          <div className="flex-1 flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Repositórios</span>
            <span className="text-[28px] font-bold text-text">{stats?.totalRepositories || 0}</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <Star size={24} className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary" />
          <div className="flex-1 flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Stars</span>
            <span className="text-[28px] font-bold text-text">{stats?.totalStars || 0}</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <GitFork size={24} className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary" />
          <div className="flex-1 flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Forks</span>
            <span className="text-[28px] font-bold text-text">{stats?.totalForks || 0}</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <AlertCircle size={24} className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary" />
          <div className="flex-1 flex flex-col">
            <span className="text-sm text-text-secondary mb-1">Issues Abertas</span>
            <span className="text-[28px] font-bold text-text">{stats?.totalOpenIssues || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-xl transition-all duration-200 hover:border-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Github size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">Repositórios Públicos</span>
            <span className="text-[22px] font-bold text-text">{stats?.publicRepos || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-xl transition-all duration-200 hover:border-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Github size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">Repositórios Privados</span>
            <span className="text-[22px] font-bold text-text">{stats?.privateRepos || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderRepositories = () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5 animate-fade-in">
      {repositories.map((repo) => (
        <div key={repo.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-[13px] text-text-secondary font-medium">{repo.owner.login}</span>
            </div>
            {repo.private && <span className="py-1 px-2.5 bg-error/10 text-error rounded-xl text-[11px] font-semibold uppercase">Privado</span>}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-text mb-2">{repo.name}</h3>
            <p className="text-sm text-text-secondary leading-[1.5] line-clamp-2">{repo.description || 'Sem descrição'}</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              {repo.language && (
                <>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                  <span className="font-medium">{repo.language}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <Star size={14} />
              <span className="font-medium">{repo.stargazers_count}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <GitFork size={14} />
              <span className="font-medium">{repo.forks_count}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <AlertCircle size={14} />
              <span className="font-medium">{repo.open_issues_count}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-border">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-secondary">Atualizado em {formatDate(repo.updated_at)}</span>
            </div>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-2 bg-primary text-white border-none rounded-md cursor-pointer transition-all duration-200 no-underline hover:bg-primary-dark hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
              title="Abrir no GitHub"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  )

  const getLanguageColor = (language: string): string => {
    const colors: { [key: string]: string } = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      Go: '#00ADD8',
      Rust: '#dea584',
      Ruby: '#701516',
      PHP: '#4F5D95',
      'C++': '#f34b7d',
      C: '#555555',
      'C#': '#178600',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Dart: '#00B4AB',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Shell: '#89e051',
      Dockerfile: '#384d54',
    }
    return colors[language] || '#858585'
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Github size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">GitHub</h1>
            <p className="text-base text-text-secondary">Gerencie repositórios, pull requests e workflows</p>
          </div>
        </div>
        <button className="flex items-center gap-2 py-3 px-6 bg-primary text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchData} disabled={loading}>
          <RefreshCw size={20} />
          <span>Atualizar</span>
        </button>
      </div>

      <IntegrationSelector
        integrationType="github"
        selectedIntegration={selectedIntegration}
        onIntegrationChange={setSelectedIntegration}
      />

      <div className="flex gap-2 border-b-2 border-border mb-6">
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'overview' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'repositories' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
          }`}
          onClick={() => setActiveTab('repositories')}
        >
          Repositórios ({repositories.length})
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading && <div className="text-center py-[60px] px-5 text-lg text-text-secondary">Carregando...</div>}

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

        {!loading && !error && !stats && activeTab === 'overview' && (
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <Github size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração</h2>
            <p className="text-base text-text-secondary max-w-[500px]">Configure uma integração do GitHub para visualizar repositórios e estatísticas</p>
          </div>
        )}

        {!loading && !error && repositories.length === 0 && activeTab === 'repositories' && (
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <Github size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração</h2>
            <p className="text-base text-text-secondary max-w-[500px]">Configure uma integração do GitHub para visualizar repositórios</p>
          </div>
        )}

        {!loading && stats && activeTab === 'overview' && renderOverview()}
        {!loading && repositories.length > 0 && activeTab === 'repositories' && renderRepositories()}
      </div>
    </div>
  )
}

export default GitHubPage
