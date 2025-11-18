import { X } from 'lucide-react'
import styles from './IntegrationTypeSelector.module.css'

interface IntegrationTypeSelectorProps {
  onSelect: (type: string) => void
  onClose: () => void
}

const integrationTypes = [
  {
    id: 'azuredevops',
    name: 'Azure DevOps',
    description: 'Conecte com pipelines, builds e releases',
    icon: '🔷',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integração com GitHub Actions (em breve)',
    icon: '🐙',
    disabled: true,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Integração com GitLab CI/CD (em breve)',
    icon: '🦊',
    disabled: true,
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Integração com Jenkins (em breve)',
    icon: '👨‍🔧',
    disabled: true,
  },
]

function IntegrationTypeSelector({ onSelect, onClose }: IntegrationTypeSelectorProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Selecione o Tipo de Integração</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.grid}>
            {integrationTypes.map((type) => (
              <button
                key={type.id}
                className={`${styles.typeCard} ${type.disabled ? styles.disabled : ''}`}
                onClick={() => !type.disabled && onSelect(type.id)}
                disabled={type.disabled}
              >
                <div className={styles.typeIcon}>{type.icon}</div>
                <div className={styles.typeInfo}>
                  <h3 className={styles.typeName}>{type.name}</h3>
                  <p className={styles.typeDescription}>{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntegrationTypeSelector
