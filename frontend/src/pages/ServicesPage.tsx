import { Box } from 'lucide-react'
import styles from './PlaceholderPage.module.css'

function ServicesPage() {
  return (
    <div className={styles.container}>
      <div className={styles.placeholder}>
        <Box size={64} className={styles.icon} />
        <h1 className={styles.title}>Catálogo de Serviços</h1>
        <p className={styles.description}>
          Visualize todos os microserviços, status, integrações e documentação em um único lugar.
        </p>
        <div className={styles.badge}>Em breve</div>
      </div>
    </div>
  )
}

export default ServicesPage
