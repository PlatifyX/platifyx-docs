import { useState, useEffect } from 'react'
import { FolderOpen, Bug, Shield, Code, TrendingUp, Copy, CheckCircle, XCircle } from 'lucide-react'
import { QualityFilterValues } from './QualityFilters'
import { apiFetch } from '../../config/api'

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
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)

      const response = await apiFetch(`quality/projects?${params.toString()}`)
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

      const response = await apiFetch(`quality/projects/${projectKey}?${params.toString()}`)
      if (!response.ok) return

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
    <div>
      <div className="text-sm text-gray-400 mb-4">
        Mostrando {projects.length} projeto{projects.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const details = projectDetails.get(project.key)

          return (
            <div key={project.key} className="card-base hover:border-blue-500/50 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-white">{project.name}</span>
                </div>
                {details?.qualityGateStatus && (
                  <div className={`${details.qualityGateStatus === 'OK' ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                    {details.qualityGateStatus === 'OK' ? (
                      <>
                        <CheckCircle size={18} />
                        <span className="text-xs">Passou</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        <span className="text-xs">Falhou</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4 space-y-1 bg-gray-800/50 p-2 rounded">
                <div className="font-mono">{project.key}</div>
                {project.integration && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Integração:</span>
                    <span className="text-blue-400">{project.integration}</span>
                  </div>
                )}
              </div>

              {details ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Bug size={14} className="text-red-500" />
                        <div className="text-xs text-gray-400">Bugs</div>
                      </div>
                      <div className="text-lg font-bold text-white">{formatNumber(details.bugs)}</div>
                    </div>

                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className="text-red-500" />
                        <div className="text-xs text-gray-400">Vulnerab.</div>
                      </div>
                      <div className="text-lg font-bold text-white">{formatNumber(details.vulnerabilities)}</div>
                    </div>

                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Code size={14} className="text-yellow-500" />
                        <div className="text-xs text-gray-400">Code Smells</div>
                      </div>
                      <div className="text-lg font-bold text-white">{formatNumber(details.code_smells)}</div>
                    </div>

                    <div className={`rounded-lg p-3 border ${
                      details.coverage >= 80
                        ? 'bg-green-500/10 border-green-500/20'
                        : details.coverage >= 50
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className={
                          details.coverage >= 80 ? 'text-green-500' :
                          details.coverage >= 50 ? 'text-yellow-500' : 'text-red-500'
                        } />
                        <div className="text-xs text-gray-400">Cobertura</div>
                      </div>
                      <div className="text-lg font-bold text-white">{details.coverage.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-1">
                      <Copy size={12} className={details.duplications > 5 ? 'text-red-500' : 'text-yellow-500'} />
                      <span className="text-gray-400">Duplicação:</span>
                      <span className="text-white font-medium">{details.duplications.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Code size={12} className="text-gray-400" />
                      <span className="text-gray-400">Linhas:</span>
                      <span className="text-white font-medium">{formatNumber(details.lines)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  Carregando detalhes...
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectsTab
