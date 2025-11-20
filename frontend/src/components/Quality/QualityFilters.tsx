import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import styles from './QualityFilters.module.css'
import { buildApiUrl } from '../../config/api'

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
      const response = await fetch(buildApiUrl('quality/projects'))
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
    <div className={styles.filtersContainer}>
      <button
        className={`${styles.toggleButton} ${showFilters ? styles.active : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={18} />
        <span>Filtros</span>
        {getActiveFilterCount() > 0 && (
          <span className={styles.badge}>{getActiveFilterCount()}</span>
        )}
      </button>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Integração</label>
              <select
                className={styles.filterSelect}
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

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Projeto</label>
              <select
                className={styles.filterSelect}
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

          <div className={styles.filterActions}>
            <button className={styles.clearButton} onClick={handleClear}>
              Limpar
            </button>
            <button className={styles.applyButton} onClick={handleApply}>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QualityFilters
