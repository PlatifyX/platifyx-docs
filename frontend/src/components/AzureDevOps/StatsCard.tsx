import { TrendingUp, TrendingDown, GitBranch, Package, Rocket } from 'lucide-react'
import styles from './StatsCard.module.css'

interface StatsCardProps {
  stats: {
    totalPipelines: number
    totalBuilds: number
    successCount: number
    failedCount: number
    runningCount: number
    successRate: number
  }
}

function StatsCard({ stats }: StatsCardProps) {
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
