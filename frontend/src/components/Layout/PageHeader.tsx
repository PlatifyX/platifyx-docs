import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}

function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        {Icon && <Icon size={40} className={styles.headerIcon} />}
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </div>
  )
}

export default PageHeader
