import { Server } from 'lucide-react'
import styles from './PlaceholderPage.module.css'

function KubernetesPage() {
  return (
    <div className={styles.container}>
      <div className={styles.placeholder}>
        <Server size={64} className={styles.icon} />
        <h1 className={styles.title}>Kubernetes</h1>
        <p className={styles.description}>
          Gerencie clusters, deployments, pods, eventos e métricas de forma centralizada.
        </p>
        <div className={styles.badge}>Em breve</div>
      </div>
    </div>
  )
}

export default KubernetesPage
