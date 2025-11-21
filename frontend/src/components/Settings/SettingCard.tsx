import { Settings, Power, Trash2 } from 'lucide-react'
import styles from './SettingCard.module.css'

interface SettingCardProps {
  title: string
  description: string
  icon: string
  configured: boolean
  enabled: boolean
  features: string[]
  onConfigure: () => void
  onToggle: () => void
  onDelete: () => void
}

function SettingCard({
  title,
  description,
  icon,
  configured,
  enabled,
  features,
  onConfigure,
  onToggle,
  onDelete
}: SettingCardProps) {
  return (
    <div className={`${styles.card} ${enabled ? styles.cardEnabled : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <div className={styles.cardTitle}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.badges}>
            {configured ? (
              <span className={`${styles.badge} ${enabled ? styles.badgeSuccess : styles.badgeInactive}`}>
                {enabled ? 'Ativo' : 'Inativo'}
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeWarning}`}>
                Não configurado
              </span>
            )}
          </div>
        </div>
      </div>

      <p className={styles.description}>{description}</p>

      <div className={styles.features}>
        <h4 className={styles.featuresTitle}>Recursos:</h4>
        <ul className={styles.featuresList}>
          {features.map((feature, index) => (
            <li key={index} className={styles.featureItem}>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.configureButton}
          onClick={onConfigure}
        >
          <Settings size={16} />
          <span>{configured ? 'Reconfigurar' : 'Configurar'}</span>
        </button>

        {configured && (
          <>
            <button
              className={`${styles.actionButton} ${enabled ? styles.actionButtonActive : ''}`}
              onClick={onToggle}
              title={enabled ? 'Desativar' : 'Ativar'}
            >
              <Power size={16} />
            </button>
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={onDelete}
              title="Remover configuração"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SettingCard
