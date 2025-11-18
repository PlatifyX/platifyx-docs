import { TrendingUp, TrendingDown, GitBranch, Package, Rocket, Clock, Calendar, AlertTriangle } from 'lucide-react'
import styles from './StatsCard.module.css'

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
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <GitBranch size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Total Pipelines</div>
          <div className={styles.statValue}>{stats.totalPipelines}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Package size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Total Builds</div>
          <div className={styles.statValue}>{stats.totalBuilds}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-success)' }}>
          <TrendingUp size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Success Rate</div>
          <div className={styles.statValue}>{stats.successRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-primary)' }}>
          <Clock size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Avg Pipeline Time</div>
          <div className={styles.statValue}>{formatTime(stats.avgPipelineTime)}</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-info)' }}>
          <Calendar size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Deploy Frequency</div>
          <div className={styles.statValue}>{stats.deployFrequency.toFixed(1)}/mês</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: stats.deployFailureRate > 20 ? 'var(--color-error)' : 'var(--color-warning)' }}>
          <AlertTriangle size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Deploy Failure Rate</div>
          <div className={styles.statValue}>{stats.deployFailureRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ color: 'var(--color-primary)' }}>
          <Rocket size={24} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statLabel}>Running</div>
          <div className={styles.statValue}>{stats.runningCount}</div>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
