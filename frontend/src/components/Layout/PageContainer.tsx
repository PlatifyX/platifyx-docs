import { ReactNode } from 'react'
import styles from './PageContainer.module.css'

interface PageContainerProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

function PageContainer({ children, maxWidth = 'xl' }: PageContainerProps) {
  return (
    <div className={`${styles.container} ${styles[maxWidth]}`}>
      {children}
    </div>
  )
}

export default PageContainer
