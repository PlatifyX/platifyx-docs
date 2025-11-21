import { useState, useEffect } from 'react'
import { Github, GitBranch, GitPullRequest, AlertCircle, RefreshCw, ExternalLink, Star, GitFork, Users } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import StatCard from '../components/UI/StatCard'
import styles from './GitHubPage.module.css'

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

  const [stats, setStats] = useState<Stats | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'overview') {
        const statsRes = await fetch(buildApiUrl('github/stats'))
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      }

      if (activeTab === 'repositories' || activeTab === 'overview') {
        const reposRes = await fetch(buildApiUrl('github/repositories'))
        if (reposRes.ok) {
          const data = await reposRes.json()
          setRepositories(data.repositories || [])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do GitHub')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} KB`
    return `${(bytes / 1024).toFixed(1)} MB`
  }

  const renderOverview = () => (
    <Section spacing="lg">
      <div className={styles.statsGrid}>
        <StatCard icon={Github} label="Repositórios" value={stats?.totalRepositories || 0} color="blue" />
        <StatCard icon={Star} label="Stars" value={stats?.totalStars || 0} color="yellow" />
        <StatCard icon={GitFork} label="Forks" value={stats?.totalForks || 0} color="green" />
        <StatCard icon={AlertCircle} label="Issues Abertas" value={stats?.totalOpenIssues || 0} color="red" />
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.statBoxIcon}>
            <Github size={20} />
          </div>
          <div className={styles.statBoxContent}>
            <span className={styles.statBoxLabel}>Repositórios Públicos</span>
            <span className={styles.statBoxValue}>{stats?.publicRepos || 0}</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statBoxIcon}>
            <Github size={20} />
          </div>
          <div className={styles.statBoxContent}>
            <span className={styles.statBoxLabel}>Repositórios Privados</span>
            <span className={styles.statBoxValue}>{stats?.privateRepos || 0}</span>
          </div>
        </div>
      </div>
    </Section>
  )

  const renderRepositories = () => (
    <Section spacing="lg">
      <div className={styles.repoGrid}>
        {repositories.map((repo) => (
        <div key={repo.id} className={styles.repoCard}>
          <div className={styles.repoHeader}>
            <div className={styles.repoOwner}>
              <img src={repo.owner.avatar_url} alt={repo.owner.login} className={styles.avatar} />
              <span className={styles.ownerName}>{repo.owner.login}</span>
            </div>
            {repo.private && <span className={styles.privateBadge}>Privado</span>}
          </div>

          <div className={styles.repoBody}>
            <h3 className={styles.repoName}>{repo.name}</h3>
            <p className={styles.repoDescription}>{repo.description || 'Sem descrição'}</p>
          </div>

          <div className={styles.repoMeta}>
            <div className={styles.metaItem}>
              {repo.language && (
                <>
                  <span className={styles.languageDot} style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                  <span className={styles.metaText}>{repo.language}</span>
                </>
              )}
            </div>
            <div className={styles.metaItem}>
              <Star size={14} />
              <span className={styles.metaText}>{repo.stargazers_count}</span>
            </div>
            <div className={styles.metaItem}>
              <GitFork size={14} />
              <span className={styles.metaText}>{repo.forks_count}</span>
            </div>
            <div className={styles.metaItem}>
              <AlertCircle size={14} />
              <span className={styles.metaText}>{repo.open_issues_count}</span>
            </div>
          </div>

          <div className={styles.repoFooter}>
            <div className={styles.repoDates}>
              <span className={styles.dateText}>Atualizado em {formatDate(repo.updated_at)}</span>
            </div>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.repoLink}
              title="Abrir no GitHub"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        ))}
      </div>
    </Section>
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
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Github}
        title="GitHub"
        subtitle="Gerencie repositórios, pull requests e workflows"
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
          className={`${styles.tab} ${activeTab === 'repositories' ? styles.active : ''}`}
          onClick={() => setActiveTab('repositories')}
        >
          Repositórios ({repositories.length})
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && !error && <div className={styles.loading}>Carregando...</div>}

      {!loading && !error && (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'repositories' && renderRepositories()}
        </>
      )}
    </PageContainer>
  )
}

export default GitHubPage
