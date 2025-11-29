import { useState, useEffect } from 'react'
import { FolderOpen, Bug, Shield, Code, TrendingUp, Copy, CheckCircle, XCircle } from 'lucide-react'
import { QualityFilterValues } from './QualityFilters'
import { getMockQualityProjects, getMockQualityProjectDetails } from '../../mocks/data/quality'

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

  useEffect(() => {
    fetchProjects()
  }, [filters])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const data = await getMockQualityProjects()
      let filteredProjects = data.projects || []

      if (filters.project) {
        filteredProjects = filteredProjects.filter((p: Project) => p.key === filters.project)
      }

      setProjects(filteredProjects)

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
      const data = await getMockQualityProjectDetails(projectKey)
      if (!data) return

      const details = await response.json()
      setProjectDetails(prev => new Map(prev).set(projectKey, details))
    } catch (err) {
      console.error(`Failed to fetch details for ${projectKey}:`, err)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Carregando projetos...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro: {error}</div>
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FolderOpen size={48} className="mb-4" />
        <p>Nenhum projeto encontrado</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const details = projectDetails.get(project.key)

        return (
          <div key={project.key} className="card-base">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-blue-400" />
                <span className="font-medium text-white">{project.name}</span>
              </div>
              {details?.qualityGateStatus && (
                <div className={details.qualityGateStatus === 'OK' ? 'text-green-500' : 'text-red-500'}>
                  {details.qualityGateStatus === 'OK' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-400 mb-4 space-y-1">
              <div>Key: {project.key}</div>
              {project.integration && (
                <div className="text-blue-400">Integração: {project.integration}</div>
              )}
            </div>

            {details && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Bug size={14} className="text-red-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Bugs</div>
                    <div className="text-sm font-medium text-white">{formatNumber(details.bugs)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-red-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Vulnerabilidades</div>
                    <div className="text-sm font-medium text-white">{formatNumber(details.vulnerabilities)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Code size={14} className="text-yellow-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Code Smells</div>
                    <div className="text-sm font-medium text-white">{formatNumber(details.code_smells)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Cobertura</div>
                    <div className="text-sm font-medium text-white">{details.coverage.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Copy size={14} className={details.duplications > 5 ? 'text-red-500' : 'text-yellow-500'} />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Duplicação</div>
                    <div className="text-sm font-medium text-white">{details.duplications.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Code size={14} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Linhas</div>
                    <div className="text-sm font-medium text-white">{formatNumber(details.lines)}</div>
                  </div>
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
