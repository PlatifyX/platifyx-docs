import { LucideIcon } from 'lucide-react'
import styles from './StatCard.module.css'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

function StatCard({ icon: Icon, label, value, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.iconWrapper} ${styles[color]}`}>
        <Icon size={24} />
      </div>
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {trend && (
          <div className={`${styles.trend} ${trend.isPositive ? styles.trendUp : styles.trendDown}`}>
            {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
