import { Bug, Shield, Code, Target, CheckCircle, XCircle, TrendingUp, Copy } from 'lucide-react'

interface QualityStatsCardProps {
  stats: {
    totalProjects: number
    totalBugs: number
    totalVulnerabilities: number
    totalCodeSmells: number
    totalSecurityHotspots: number
    totalLines: number
    avgCoverage: number
    avgDuplications: number
    passedQualityGates: number
    failedQualityGates: number
    qualityGatePassRate: number
  }
}

function QualityStatsCard({ stats }: QualityStatsCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const StatCard = ({ icon, label, value, color, trend }: {
    icon: React.ReactNode
    label: string
    value: string | number
    color: string
    trend?: 'good' | 'bad' | 'neutral'
  }) => (
    <div className="card-base hover:shadow-lg transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className={`${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded ${
            trend === 'good' ? 'bg-green-500/20 text-green-400' :
            trend === 'bad' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {trend === 'good' ? '✓' : trend === 'bad' ? '⚠' : '−'}
          </div>
        )}
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{label}</div>
        <div className="text-3xl font-bold text-white">{value}</div>
      </div>
    </div>
  )

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={<Target size={28} />}
          label="Total de Projetos"
          value={stats.totalProjects}
          color="text-blue-500"
        />
        <StatCard
          icon={<Bug size={28} />}
          label="Bugs"
          value={formatNumber(stats.totalBugs)}
          color="text-red-500"
          trend={stats.totalBugs === 0 ? 'good' : stats.totalBugs > 100 ? 'bad' : 'neutral'}
        />
        <StatCard
          icon={<Shield size={28} />}
          label="Vulnerabilidades"
          value={formatNumber(stats.totalVulnerabilities)}
          color="text-red-500"
          trend={stats.totalVulnerabilities === 0 ? 'good' : stats.totalVulnerabilities > 50 ? 'bad' : 'neutral'}
        />
        <StatCard
          icon={<Code size={28} />}
          label="Code Smells"
          value={formatNumber(stats.totalCodeSmells)}
          color="text-yellow-500"
          trend={stats.totalCodeSmells < 100 ? 'good' : stats.totalCodeSmells > 500 ? 'bad' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Shield size={28} />}
          label="Security Hotspots"
          value={formatNumber(stats.totalSecurityHotspots)}
          color="text-orange-500"
          trend={stats.totalSecurityHotspots === 0 ? 'good' : stats.totalSecurityHotspots > 30 ? 'bad' : 'neutral'}
        />
        <StatCard
          icon={<TrendingUp size={28} />}
          label="Cobertura Média"
          value={`${stats.avgCoverage.toFixed(1)}%`}
          color="text-green-500"
          trend={stats.avgCoverage >= 80 ? 'good' : stats.avgCoverage < 50 ? 'bad' : 'neutral'}
        />
        <StatCard
          icon={<Copy size={28} />}
          label="Duplicação Média"
          value={`${stats.avgDuplications.toFixed(1)}%`}
          color={stats.avgDuplications > 5 ? 'text-red-500' : 'text-yellow-500'}
          trend={stats.avgDuplications < 3 ? 'good' : stats.avgDuplications > 10 ? 'bad' : 'neutral'}
        />
        <StatCard
          icon={stats.qualityGatePassRate >= 80 ? <CheckCircle size={28} /> : <XCircle size={28} />}
          label="Quality Gate Pass Rate"
          value={`${stats.qualityGatePassRate.toFixed(1)}%`}
          color={stats.qualityGatePassRate >= 80 ? 'text-green-500' : 'text-red-500'}
          trend={stats.qualityGatePassRate >= 90 ? 'good' : stats.qualityGatePassRate < 70 ? 'bad' : 'neutral'}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <span>Quality Gates Aprovados</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.passedQualityGates}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <XCircle size={16} className="text-red-500" />
            <span>Quality Gates Reprovados</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.failedQualityGates}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Code size={16} className="text-blue-500" />
            <span>Total de Linhas</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalLines)}</div>
        </div>
      </div>
    </div>
  )
}

export default QualityStatsCard
