import { Bug, Shield, Code, Target, CheckCircle, XCircle, TrendingUp, Copy } from 'lucide-react'
import styles from './QualityStatsCard.module.css'

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
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Target size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Total de Projetos</div>
          <div className={styles.statValue}>{stats.totalProjects}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-error)' }}>
          <Bug size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Bugs</div>
          <div className={styles.statValue}>{formatNumber(stats.totalBugs)}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-error)' }}>
          <Shield size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Vulnerabilidades</div>
          <div className={styles.statValue}>{formatNumber(stats.totalVulnerabilities)}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-warning)' }}>
          <Code size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Code Smells</div>
          <div className={styles.statValue}>{formatNumber(stats.totalCodeSmells)}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-warning)' }}>
          <Shield size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Security Hotspots</div>
          <div className={styles.statValue}>{formatNumber(stats.totalSecurityHotspots)}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-success)' }}>
          <TrendingUp size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Cobertura Média</div>
          <div className={styles.statValue}>{stats.avgCoverage.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: stats.avgDuplications > 5 ? 'var(--color-error)' : 'var(--color-warning)' }}>
          <Copy size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Duplicação Média</div>
          <div className={styles.statValue}>{stats.avgDuplications.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: stats.qualityGatePassRate >= 80 ? 'var(--color-success)' : 'var(--color-error)' }}>
          {stats.qualityGatePassRate >= 80 ? <CheckCircle size={24} /> : <XCircle size={24} />}
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Quality Gate Pass Rate</div>
          <div className={styles.statValue}>{stats.qualityGatePassRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

export default QualityStatsCard
