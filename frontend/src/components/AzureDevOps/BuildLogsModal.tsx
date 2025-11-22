import { useState, useEffect } from 'react'
import { X, Terminal, Download } from 'lucide-react'
import { buildApiUrl } from '../../config/api'

interface BuildLogsModalProps {
  buildId: number
  buildNumber: string
  onClose: () => void
}

function BuildLogsModal({ buildId, buildNumber, onClose }: BuildLogsModalProps) {
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [buildId])

  const fetchLogs = async () => {
    try {
      const response = await fetch(buildApiUrl(`ci/builds/${buildId}/logs`))
      if (!response.ok) throw new Error('Failed to fetch build logs')
      const data = await response.json()
      setLogs(data.logs || 'Nenhum log disponível')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `build-${buildNumber}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Terminal size={24} className="text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-text">Build Logs</h2>
              <p className="text-sm text-text-secondary">Build #{buildNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-surface-light text-text-secondary hover:bg-primary/10 hover:text-primary border-none cursor-pointer transition-colors" onClick={downloadLogs} title="Download logs">
              <Download size={18} />
            </button>
            <button className="p-2 rounded-lg bg-surface-light text-text-secondary hover:bg-error/10 hover:text-error border-none cursor-pointer transition-colors" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Terminal size={48} className="mb-4 opacity-50" />
              <p>Carregando logs...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-10 px-5 text-error bg-error/10 border border-error rounded-xl">
              <p>Erro: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <pre className="font-mono text-sm text-text-secondary bg-surface-light p-4 rounded-lg overflow-auto whitespace-pre-wrap">{logs}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildLogsModal
