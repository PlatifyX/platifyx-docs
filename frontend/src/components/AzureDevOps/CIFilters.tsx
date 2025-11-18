import { useState, useEffect } from 'react'
import { Filter, X, Calendar, FolderTree, Building2 } from 'lucide-react'
import styles from './CIFilters.module.css'

interface Pipeline {
  id: number
  name: string
  project?: string
  integration?: string
}

export interface FilterValues {
  integration: string
  startDate: string
  endDate: string
  project: string
}

interface CIFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  initialFilters?: FilterValues
}

function CIFilters({ onFilterChange, initialFilters }: CIFiltersProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const [integration, setIntegration] = useState(initialFilters?.integration || '')
  const [startDate, setStartDate] = useState(initialFilters?.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters?.endDate || '')
  const [project, setProject] = useState(initialFilters?.project || '')

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const response = await fetch('http://localhost:8060/api/v1/ci/pipelines')
      if (response.ok) {
        const data = await response.json()
        setPipelines(data.pipelines || [])
      }
    } catch (err) {
      console.error('Failed to fetch pipelines:', err)
    }
  }

  const uniqueIntegrations = Array.from(new Set(pipelines.map(p => p.integration || 'N/A')))
  const filteredProjects = integration
    ? Array.from(new Set(pipelines.filter(p => p.integration === integration).map(p => p.project || '')))
    : Array.from(new Set(pipelines.map(p => p.project || '')))

  const handleApplyFilters = () => {
    onFilterChange({
      integration,
      startDate,
      endDate,
      project,
    })
  }

  const handleClearFilters = () => {
    setIntegration('')
    setStartDate('')
    setEndDate('')
    setProject('')
    onFilterChange({
      integration: '',
      startDate: '',
      endDate: '',
      project: '',
    })
  }

  const hasActiveFilters = integration || startDate || endDate || project

  return (
    <div className={styles.container}>
      <button
        className={`${styles.toggleButton} ${hasActiveFilters ? styles.active : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={18} />
        <span>Filtros</span>
        {hasActiveFilters && <span className={styles.badge}>{
          [integration, startDate, endDate, project].filter(Boolean).length
        }</span>}
      </button>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.label}>
                <Building2 size={16} />
                Integração
              </label>
              <select
                className={styles.select}
                value={integration}
                onChange={(e) => {
                  setIntegration(e.target.value)
                  setProject('') // Reset project when integration changes
                }}
              >
                <option value="">Todas as integrações</option>
                {uniqueIntegrations.map((int) => (
                  <option key={int} value={int}>
                    {int}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.label}>
                <FolderTree size={16} />
                Projeto
              </label>
              <select
                className={styles.select}
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">Todos os projetos</option>
                {filteredProjects.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.label}>
                <Calendar size={16} />
                Data Início
              </label>
              <input
                type="date"
                className={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.label}>
                <Calendar size={16} />
                Data Fim
              </label>
              <input
                type="date"
                className={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.clearButton}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <X size={16} />
              Limpar
            </button>
            <button
              className={styles.applyButton}
              onClick={handleApplyFilters}
            >
              <Filter size={16} />
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CIFilters
