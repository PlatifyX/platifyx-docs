import { TrendingUp, GitBranch, Package, Rocket, Clock, Calendar, AlertTriangle } from 'lucide-react'

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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mb-8">
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center text-white">
          <GitBranch size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Total Pipelines</div>
          <div className="text-[28px] font-bold text-text">{stats.totalPipelines}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center text-white">
          <Package size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Total Builds</div>
          <div className="text-[28px] font-bold text-text">{stats.totalBuilds}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center text-success">
          <TrendingUp size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Success Rate</div>
          <div className="text-[28px] font-bold text-text">{stats.successRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center text-primary">
          <Clock size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Avg Pipeline Time</div>
          <div className="text-[28px] font-bold text-text">{formatTime(stats.avgPipelineTime)}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center text-white">
          <Calendar size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Deploy Frequency</div>
          <div className="text-[28px] font-bold text-text">{stats.deployFrequency.toFixed(1)}/mês</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className={`w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center ${stats.deployFailureRate > 20 ? 'text-error' : 'text-warning'}`}>
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Deploy Failure Rate</div>
          <div className="text-[28px] font-bold text-text">{stats.deployFailureRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-[10px] flex items-center justify-center text-primary">
          <Rocket size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-text-secondary mb-1 font-medium">Running</div>
          <div className="text-[28px] font-bold text-text">{stats.runningCount}</div>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
