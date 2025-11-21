import { X } from 'lucide-react'
import styles from './RecommendationDetailsModal.module.css'

interface CostOptimizationRecommendation {
  provider: string
  integration: string
  resourceId: string
  resourceType: string
  recommendedAction: string
  currentConfiguration: string
  recommendedConfiguration: string
  estimatedMonthlySavings: number
  estimatedSavingsPercent: number
  currentMonthlyCost: number
  implementationEffort: string
  requiresRestart: boolean
  rollbackPossible: boolean
  accountName: string
  accountId: string
  region: string
  tags?: { [key: string]: string }
  currency: string
}

interface RecommendationDetailsModalProps {
  recommendation: CostOptimizationRecommendation | null
  onClose: () => void
}

function RecommendationDetailsModal({ recommendation, onClose }: RecommendationDetailsModalProps) {
  if (!recommendation) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const getEffortColor = (effort: string) => {
    const effortLower = effort.toLowerCase().replace(/\s/g, '')
    if (effortLower === 'baixo') return styles.effortBaixo
    if (effortLower === 'médio') return styles.effortMédio
    if (effortLower === 'alto') return styles.effortAlto
    if (effortLower === 'muitoalto') return styles.effortMuitoAlto
    return ''
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Detalhes da Recomendação</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Savings Highlight */}
          <div className={styles.savingsHighlight}>
            <div className={styles.savingsAmount}>
              {formatCurrency(recommendation.estimatedMonthlySavings)}
              <span className={styles.savingsPeriod}>/mês</span>
            </div>
            <div className={styles.savingsPercent}>
              {recommendation.estimatedSavingsPercent.toFixed(0)}% de economia
            </div>
          </div>

          {/* Resource Info */}
          <div className={styles.section}>
            <h3>Informações do Recurso</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.label}>Tipo:</span>
                <span className={styles.value}>{recommendation.resourceType}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>ID:</span>
                <span className={`${styles.value} ${styles.mono}`}>{recommendation.resourceId}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Região:</span>
                <span className={styles.value}>{recommendation.region}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Conta:</span>
                <span className={styles.value}>
                  {recommendation.accountName} ({recommendation.accountId})
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={styles.section}>
            <h3>Recomendação</h3>
            <div className={styles.actionCard}>
              <div className={styles.actionLabel}>Ação Recomendada:</div>
              <div className={styles.actionValue}>{recommendation.recommendedAction}</div>
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.label}>Configuração Atual:</span>
                <span className={styles.value}>{recommendation.currentConfiguration}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Configuração Recomendada:</span>
                <span className={styles.value}>{recommendation.recommendedConfiguration}</span>
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className={styles.section}>
            <h3>Análise de Custos</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.label}>Custo Atual:</span>
                <span className={styles.value}>{formatCurrency(recommendation.currentMonthlyCost)}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Economia Estimada:</span>
                <span className={`${styles.value} ${styles.success}`}>
                  {formatCurrency(recommendation.estimatedMonthlySavings)}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Porcentagem de Economia:</span>
                <span className={`${styles.value} ${styles.success}`}>
                  {recommendation.estimatedSavingsPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Implementation */}
          <div className={styles.section}>
            <h3>Implementação</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.label}>Esforço:</span>
                <span className={`${styles.badge} ${getEffortColor(recommendation.implementationEffort)}`}>
                  {recommendation.implementationEffort}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Requer Reinício:</span>
                <span className={styles.value}>{recommendation.requiresRestart ? 'Sim' : 'Não'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Reversão Possível:</span>
                <span className={styles.value}>{recommendation.rollbackPossible ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {recommendation.tags && Object.keys(recommendation.tags).length > 0 && (
            <div className={styles.section}>
              <h3>Tags</h3>
              <div className={styles.tagsContainer}>
                {Object.entries(recommendation.tags).map(([key, value]) => (
                  <div key={key} className={styles.tag}>
                    <span className={styles.tagKey}>{key}:</span>
                    <span className={styles.tagValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecommendationDetailsModal
