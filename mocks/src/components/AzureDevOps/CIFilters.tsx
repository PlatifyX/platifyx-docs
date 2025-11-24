import { useState, useEffect } from 'react'
import { Filter, X, Calendar, FolderTree, Building2 } from 'lucide-react'
import { apiFetch } from '../../config/api'

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
      const response = await apiFetch('ci/pipelines')
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
    <div className="mb-6">
      <button
        className={`flex items-center gap-2 py-2.5 px-4 border border-border rounded-lg bg-surface text-text text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out relative ${
          hasActiveFilters ? 'bg-primary text-white border-primary' : 'hover:bg-surface-light hover:border-primary'
        }`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={18} />
        <span>Filtros</span>
        {hasActiveFilters && <span className="bg-white/30 text-white py-0.5 px-2 rounded-xl text-xs font-semibold">{
          [integration, startDate, endDate, project].filter(Boolean).length
        }</span>}
      </button>

      {showFilters && (
        <div className="mt-4 p-5 border border-border rounded-lg bg-surface">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                <Building2 size={16} className="text-text-secondary" />
                Integração
              </label>
              <select
                className="w-full py-2.5 px-3 border border-border rounded-md bg-background text-text text-sm transition-all duration-200 ease-in-out focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
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

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                <FolderTree size={16} className="text-text-secondary" />
                Projeto
              </label>
              <select
                className="w-full py-2.5 px-3 border border-border rounded-md bg-background text-text text-sm transition-all duration-200 ease-in-out focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
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

          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-5">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                <Calendar size={16} className="text-text-secondary" />
                Data Início
              </label>
              <input
                type="date"
                className="w-full py-2.5 px-3 border border-border rounded-md bg-background text-text text-sm transition-all duration-200 ease-in-out focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                <Calendar size={16} className="text-text-secondary" />
                Data Fim
              </label>
              <input
                type="date"
                className="w-full py-2.5 px-3 border border-border rounded-md bg-background text-text text-sm transition-all duration-200 ease-in-out focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              className="flex items-center gap-1.5 py-2.5 px-5 rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border border-border bg-transparent text-text-secondary hover:bg-surface-light hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <X size={16} />
              Limpar
            </button>
            <button
              className="flex items-center gap-1.5 py-2.5 px-5 rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out border-none bg-primary text-white hover:bg-primary-dark hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
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
