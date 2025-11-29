import { TrendingUp, GitBranch, Package, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface StatsCardProps {
  stats: {
    totalPipelines: number
    totalBuilds: number
    successCount: number
    failedCount: number
    runningCount: number
    successRate: number
    avgPipelineTime: number
    deployFrequency: number
    deployFailureRate: number
  }
}

function StatsCard({ stats }: StatsCardProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(0)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="flex flex-nowrap gap-6 mb-8 overflow-x-auto">
      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <GitBranch className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Total Pipelines</div>
        <div className="text-3xl font-bold text-text">{stats.totalPipelines}</div>
      </div>

      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Total Builds</div>
        <div className="text-3xl font-bold text-text">{stats.totalBuilds}</div>
      </div>

      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-success hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Sucessos</div>
        <div className="text-3xl font-bold text-text">{stats.successCount}</div>
      </div>

      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-error hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-error/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <XCircle className="w-7 h-7 text-error" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Falhas</div>
        <div className="text-3xl font-bold text-text">{stats.failedCount}</div>
      </div>

      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Taxa de Sucesso</div>
        <div className="text-3xl font-bold text-text">{stats.successRate.toFixed(1)}%</div>
        <div className="h-2 bg-background rounded-full mt-3 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-success" 
            style={{ width: `${stats.successRate}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Tempo Médio</div>
        <div className="text-3xl font-bold text-text">{formatTime(stats.avgPipelineTime)}</div>
      </div>

      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-lg hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex-shrink-0 min-w-[200px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Frequência de Deploy</div>
        <div className="text-3xl font-bold text-text">{stats.deployFrequency.toFixed(1)}</div>
        <div className="text-sm text-text-secondary mt-1">por mês</div>
      </div>
    </div>
  )
}

export default StatsCard
