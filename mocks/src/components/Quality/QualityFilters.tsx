import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import { apiFetch } from '../../config/api'

export interface QualityFilterValues {
  integration: string
  project: string
}

interface QualityFiltersProps {
  onFilterChange: (filters: QualityFilterValues) => void
  initialFilters?: QualityFilterValues
}

interface Project {
  key: string
  name: string
  integration?: string
}

function QualityFilters({ onFilterChange, initialFilters }: QualityFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [integration, setIntegration] = useState(initialFilters?.integration || '')
  const [project, setProject] = useState(initialFilters?.project || '')
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await apiFetch('quality/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const handleApply = () => {
    onFilterChange({
      integration,
      project,
    })
  }

  const handleClear = () => {
    setIntegration('')
    setProject('')
    onFilterChange({
      integration: '',
      project: '',
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (integration) count++
    if (project) count++
    return count
  }

  const integrations = Array.from(new Set(projects.map(p => p.integration || '').filter(Boolean)))
  const filteredProjects = integration
    ? projects.filter(p => p.integration === integration)
    : projects

  return (
    <div className="mb-6">
      <button
        className={`btn-base flex items-center gap-2 ${showFilters ? 'bg-blue-600' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={18} />
        <span>Filtros</span>
        {getActiveFilterCount() > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {getActiveFilterCount()}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="card-base mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Integração</label>
              <select
                className="input-base w-full"
                value={integration}
                onChange={(e) => {
                  setIntegration(e.target.value)
                  setProject('') // Reset project when integration changes
                }}
              >
                <option value="">Todas</option>
                {integrations.map((int) => (
                  <option key={int} value={int}>
                    {int}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Projeto</label>
              <select
                className="input-base w-full"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">Todos</option>
                {filteredProjects.map((proj) => (
                  <option key={proj.key} value={proj.key}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="btn-base bg-gray-700 hover:bg-gray-600" onClick={handleClear}>
              Limpar
            </button>
            <button className="btn-base bg-blue-600 hover:bg-blue-700" onClick={handleApply}>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QualityFilters
