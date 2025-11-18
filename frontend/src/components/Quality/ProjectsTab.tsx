import { useState, useEffect } from 'react'
import { FolderOpen, Bug, Shield, Code, TrendingUp, Copy, CheckCircle, XCircle } from 'lucide-react'
import { QualityFilterValues } from './QualityFilters'
import styles from './QualityTabs.module.css'

interface Project {
  key: string
  name: string
  qualifier: string
  visibility: string
  integration?: string
}

interface ProjectDetails {
  key: string
  name: string
  integration?: string
  bugs: number
  vulnerabilities: number
  code_smells: number
  coverage: number
  duplications: number
  security_hotspots: number
  lines: number
  qualityGateStatus: string
}

interface ProjectsTabProps {
  filters: QualityFilterValues
}

function ProjectsTab({ filters }: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectDetails, setProjectDetails] = useState<Map<string, ProjectDetails>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [filters])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)

      const response = await fetch(`http://localhost:8060/api/v1/quality/projects?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()

      let filteredProjects = data.projects || []

      // Apply project filter
      if (filters.project) {
        filteredProjects = filteredProjects.filter((p: Project) => p.key === filters.project)
      }

      setProjects(filteredProjects)

      // Fetch details for each project
      filteredProjects.forEach((project: Project) => {
        fetchProjectDetails(project.key, project.integration)
      })

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectDetails = async (projectKey: string, integration?: string) => {
    try {
      const params = new URLSearchParams()
      if (integration) params.append('integration', integration)

      const response = await fetch(`http://localhost:8060/api/v1/quality/projects/${projectKey}?${params.toString()}`)
      if (!response.ok) return

      const details = await response.json()
      setProjectDetails(prev => new Map(prev).set(projectKey, details))
    } catch (err) {
      console.error(`Failed to fetch details for ${projectKey}:`, err)
    }
  }

  const getQualityGateColor = (status: string) => {
    switch (status) {
      case 'OK':
        return 'var(--color-success)'
      case 'ERROR':
        return 'var(--color-error)'
      default:
        return 'var(--color-text-secondary)'
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (loading) {
    return <div className={styles.loading}>Carregando projetos...</div>
  }

  if (error) {
    return <div className={styles.error}>Erro: {error}</div>
  }

  if (projects.length === 0) {
    return (
      <div className={styles.empty}>
        <FolderOpen size={48} />
        <p>Nenhum projeto encontrado</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {projects.map((project) => {
        const details = projectDetails.get(project.key)

        return (
          <div key={project.key} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <FolderOpen size={18} />
                <span>{project.name}</span>
              </div>
              {details?.qualityGateStatus && (
                <div
                  className={styles.qualityGate}
                  style={{ color: getQualityGateColor(details.qualityGateStatus) }}
                >
                  {details.qualityGateStatus === 'OK' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                </div>
              )}
            </div>

            <div className={styles.cardMeta}>
              <span>Key: {project.key}</span>
              {project.integration && (
                <span className={styles.integration}>Integração: {project.integration}</span>
              )}
            </div>

            {details && (
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <Bug size={14} style={{ color: 'var(--color-error)' }} />
                  <span className={styles.metricLabel}>Bugs</span>
                  <span className={styles.metricValue}>{formatNumber(details.bugs)}</span>
                </div>

                <div className={styles.metric}>
                  <Shield size={14} style={{ color: 'var(--color-error)' }} />
                  <span className={styles.metricLabel}>Vulnerabilidades</span>
                  <span className={styles.metricValue}>{formatNumber(details.vulnerabilities)}</span>
                </div>

                <div className={styles.metric}>
                  <Code size={14} style={{ color: 'var(--color-warning)' }} />
                  <span className={styles.metricLabel}>Code Smells</span>
                  <span className={styles.metricValue}>{formatNumber(details.code_smells)}</span>
                </div>

                <div className={styles.metric}>
                  <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
                  <span className={styles.metricLabel}>Cobertura</span>
                  <span className={styles.metricValue}>{details.coverage.toFixed(1)}%</span>
                </div>

                <div className={styles.metric}>
                  <Copy size={14} style={{ color: details.duplications > 5 ? 'var(--color-error)' : 'var(--color-warning)' }} />
                  <span className={styles.metricLabel}>Duplicação</span>
                  <span className={styles.metricValue}>{details.duplications.toFixed(1)}%</span>
                </div>

                <div className={styles.metric}>
                  <Code size={14} />
                  <span className={styles.metricLabel}>Linhas</span>
                  <span className={styles.metricValue}>{formatNumber(details.lines)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProjectsTab
