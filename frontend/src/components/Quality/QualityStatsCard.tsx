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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="card-base">
        <div className="text-blue-500 mb-3">
          <Target size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Total de Projetos</div>
          <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
        </div>
      </div>

      <div className="card-base">
        <div className="text-red-500 mb-3">
          <Bug size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Bugs</div>
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalBugs)}</div>
        </div>
      </div>

      <div className="card-base">
        <div className="text-red-500 mb-3">
          <Shield size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Vulnerabilidades</div>
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalVulnerabilities)}</div>
        </div>
      </div>

      <div className="card-base">
        <div className="text-yellow-500 mb-3">
          <Code size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Code Smells</div>
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalCodeSmells)}</div>
        </div>
      </div>

      <div className="card-base">
        <div className="text-yellow-500 mb-3">
          <Shield size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Security Hotspots</div>
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalSecurityHotspots)}</div>
        </div>
      </div>

      <div className="card-base">
        <div className="text-green-500 mb-3">
          <TrendingUp size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Cobertura Média</div>
          <div className="text-2xl font-bold text-white">{stats.avgCoverage.toFixed(1)}%</div>
        </div>
      </div>

      <div className="card-base">
        <div className={`mb-3 ${stats.avgDuplications > 5 ? 'text-red-500' : 'text-yellow-500'}`}>
          <Copy size={24} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Duplicação Média</div>
          <div className="text-2xl font-bold text-white">{stats.avgDuplications.toFixed(1)}%</div>
        </div>
      </div>

      <div className="card-base">
        <div className={`mb-3 ${stats.qualityGatePassRate >= 80 ? 'text-green-500' : 'text-red-500'}`}>
          {stats.qualityGatePassRate >= 80 ? <CheckCircle size={24} /> : <XCircle size={24} />}
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Quality Gate Pass Rate</div>
          <div className="text-2xl font-bold text-white">{stats.qualityGatePassRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

export default QualityStatsCard
