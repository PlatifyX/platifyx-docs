import { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  children: ReactNode
  title?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
  className?: string
}

function Card({ children, title, padding = 'md', hover = false, className = '' }: CardProps) {
  return (
    <div className={`${styles.card} ${styles[`padding-${padding}`]} ${hover ? styles.hover : ''} ${className}`}>
      {title && <h3 className={styles.cardTitle}>{title}</h3>}
      <div className={styles.cardContent}>{children}</div>
    </div>
  )
}

export default Card
