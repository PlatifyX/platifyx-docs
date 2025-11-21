import { ReactNode } from 'react'
import styles from './Section.module.css'

interface SectionProps {
  title?: string
  icon?: string
  children: ReactNode
  spacing?: 'sm' | 'md' | 'lg'
}

function Section({ title, icon, children, spacing = 'md' }: SectionProps) {
  return (
    <section className={`${styles.section} ${styles[`spacing-${spacing}`]}`}>
      {title && (
        <h2 className={styles.sectionTitle}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {title}
        </h2>
      )}
      <div className={styles.sectionContent}>{children}</div>
    </section>
  )
}

export default Section
