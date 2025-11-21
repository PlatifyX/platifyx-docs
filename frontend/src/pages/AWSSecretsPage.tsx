import { useState, useEffect } from 'react'
import { Lock, Key, Eye, EyeOff, Edit2, Plus, RefreshCw, AlertCircle } from 'lucide-react'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import { buildApiUrl } from '../config/api'
import styles from './AWSSecretsPage.module.css'

interface AWSIntegration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: {
    accountName: string
    region: string
  }
}

interface AWSSecret {
  arn: string
  name: string
  description?: string
  rotationEnabled: boolean
  lastChangedDate?: string
  tags?: Record<string, string>
}

interface AWSSecretDetail extends AWSSecret {
  secretString?: string
  versionId?: string
  createdDate?: string
}

interface Stats {
  totalSecrets: number
  rotationEnabled: number
  scheduledForDeletion: number
  region: string
}

function AWSSecretsPage() {
  const [integrations, setIntegrations] = useState<AWSIntegration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<AWSIntegration | null>(null)
  const [secrets, setSecrets] = useState<AWSSecret[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSecrets, setLoadingSecrets] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<AWSSecretDetail | null>(null)
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSecret, setEditingSecret] = useState<{ name: string; value: string } | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  useEffect(() => {
    if (selectedIntegration) {
      fetchStats()
      fetchSecrets()
    }
  }, [selectedIntegration])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(buildApiUrl('awssecrets/integrations'))
      if (!response.ok) throw new Error('Falha ao carregar integrações AWS')
      const data = await response.json()
      setIntegrations(data.data || [])

      // Select first integration by default
      if (data.data && data.data.length > 0) {
        setSelectedIntegration(data.data[0])
      }
    } catch (err) {
      console.error('Error fetching AWS integrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!selectedIntegration) return

    try {
      const response = await fetch(
        buildApiUrl(`awssecrets/stats?integrationId=${selectedIntegration.id}`)
      )
      if (!response.ok) throw new Error('Falha ao carregar estatísticas')
      const data = await response.json()
      setStats(data.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchSecrets = async () => {
    if (!selectedIntegration) return

    setLoadingSecrets(true)
    try {
      const response = await fetch(
        buildApiUrl(`awssecrets/list?integrationId=${selectedIntegration.id}`)
      )
      if (!response.ok) throw new Error('Falha ao carregar secrets')
      const data = await response.json()
      setSecrets(data.data.secrets || [])
    } catch (err) {
      console.error('Error fetching secrets:', err)
    } finally {
      setLoadingSecrets(false)
    }
  }

  const handleViewSecret = async (secretName: string) => {
    if (!selectedIntegration) return

    try {
      const response = await fetch(
        buildApiUrl(`awssecrets/secret/${encodeURIComponent(secretName)}?integrationId=${selectedIntegration.id}`)
      )
      if (!response.ok) throw new Error('Falha ao carregar secret')
      const data = await response.json()
      setSelectedSecret(data.data)
      setShowSecretValue(false)
    } catch (err) {
      console.error('Error fetching secret:', err)
      alert('Erro ao carregar secret')
    }
  }

  const handleEditSecret = (secret: AWSSecretDetail) => {
    setEditingSecret({
      name: secret.name,
      value: secret.secretString || '',
    })
    setShowEditModal(true)
  }

  const handleUpdateSecret = async () => {
    if (!editingSecret || !selectedIntegration) return

    try {
      const response = await fetch(
        buildApiUrl(`awssecrets/update/${encodeURIComponent(editingSecret.name)}?integrationId=${selectedIntegration.id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secretString: editingSecret.value }),
        }
      )

      if (!response.ok) throw new Error('Falha ao atualizar secret')

      alert('Secret atualizado com sucesso!')
      setShowEditModal(false)
      setEditingSecret(null)

      // Refresh the secret detail
      if (selectedSecret) {
        await handleViewSecret(selectedSecret.name)
      }

      // Refresh the list
      await fetchSecrets()
    } catch (err) {
      console.error('Error updating secret:', err)
      alert('Erro ao atualizar secret')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatSecretValue = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return value
    }
  }

  if (loading) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader
          icon={Lock}
          title="AWS Secrets Manager"
          subtitle="Gerenciar secrets da AWS"
        />
        <div className={styles.loading}>Carregando...</div>
      </PageContainer>
    )
  }

  if (integrations.length === 0) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader
          icon={Lock}
          title="AWS Secrets Manager"
          subtitle="Gerenciar secrets da AWS"
        />
        <Card>
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <h3>Nenhuma integração AWS configurada</h3>
            <p>Configure uma integração AWS na página de Integrações para começar.</p>
            <Button variant="primary" onClick={() => window.location.href = '/integrations'}>
              Ir para Integrações
            </Button>
          </div>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Lock}
        title="AWS Secrets Manager"
        subtitle="Gerenciar secrets da AWS"
        actions={
          <Button
            variant="primary"
            icon={RefreshCw}
            onClick={() => {
              fetchStats()
              fetchSecrets()
            }}
          >
            Atualizar
          </Button>
        }
      />

      {/* Account Selector */}
      <Section spacing="md">
        <div className={styles.accountSelector}>
          <label htmlFor="account">Conta AWS:</label>
          <select
            id="account"
            value={selectedIntegration?.id || ''}
            onChange={(e) => {
              const integration = integrations.find(
                (i) => i.id === parseInt(e.target.value)
              )
              setSelectedIntegration(integration || null)
              setSelectedSecret(null)
            }}
            className={styles.select}
          >
            {integrations.map((integration) => (
              <option key={integration.id} value={integration.id}>
                {integration.config.accountName} ({integration.config.region})
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Stats */}
      {stats && (
        <Section spacing="lg">
          <div className={styles.statsGrid}>
            <StatCard
              icon={Key}
              label="Total de Secrets"
              value={stats.totalSecrets.toString()}
            />
            <StatCard
              icon={RefreshCw}
              label="Com Rotação"
              value={stats.rotationEnabled.toString()}
            />
            <StatCard
              icon={AlertCircle}
              label="Agendados para Exclusão"
              value={stats.scheduledForDeletion.toString()}
            />
          </div>
        </Section>
      )}

      {/* Secrets List */}
      <Section title="Secrets" spacing="lg">
        {loadingSecrets ? (
          <div className={styles.loading}>Carregando secrets...</div>
        ) : (
          <div className={styles.secretsGrid}>
            {secrets.map((secret) => (
              <Card key={secret.arn} className={styles.secretCard}>
                <div className={styles.secretHeader}>
                  <div className={styles.secretInfo}>
                    <h3>{secret.name}</h3>
                    {secret.description && (
                      <p className={styles.description}>{secret.description}</p>
                    )}
                  </div>
                  <div className={styles.secretActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewSecret(secret.name)}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
                <div className={styles.secretMeta}>
                  {secret.rotationEnabled && (
                    <Badge variant="success">Rotação Ativa</Badge>
                  )}
                  {secret.lastChangedDate && (
                    <span className={styles.date}>
                      Modificado: {formatDate(secret.lastChangedDate)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Secret Detail Modal */}
      {selectedSecret && (
        <div className={styles.modal} onClick={() => setSelectedSecret(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedSecret.name}</h2>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedSecret(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>ARN:</strong>
                <span>{selectedSecret.arn}</span>
              </div>
              {selectedSecret.description && (
                <div className={styles.detailRow}>
                  <strong>Descrição:</strong>
                  <span>{selectedSecret.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <strong>Rotação:</strong>
                <Badge variant={selectedSecret.rotationEnabled ? 'success' : 'default'}>
                  {selectedSecret.rotationEnabled ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              {selectedSecret.createdDate && (
                <div className={styles.detailRow}>
                  <strong>Criado em:</strong>
                  <span>{formatDate(selectedSecret.createdDate)}</span>
                </div>
              )}

              <div className={styles.secretValueSection}>
                <div className={styles.secretValueHeader}>
                  <strong>Valor:</strong>
                  <div className={styles.valueActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={showSecretValue ? EyeOff : Eye}
                      onClick={() => setShowSecretValue(!showSecretValue)}
                    >
                      {showSecretValue ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleEditSecret(selectedSecret)}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
                <pre className={styles.secretValue}>
                  {showSecretValue
                    ? formatSecretValue(selectedSecret.secretString || '')
                    : '••••••••••••••••'}
                </pre>
              </div>

              {selectedSecret.tags && Object.keys(selectedSecret.tags).length > 0 && (
                <div className={styles.tagsSection}>
                  <strong>Tags:</strong>
                  <div className={styles.tags}>
                    {Object.entries(selectedSecret.tags).map(([key, value]) => (
                      <Badge key={key} variant="default">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSecret && (
        <div className={styles.modal} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Secret: {editingSecret.name}</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="secretValue">Novo Valor:</label>
                <textarea
                  id="secretValue"
                  className={styles.textarea}
                  value={editingSecret.value}
                  onChange={(e) =>
                    setEditingSecret({ ...editingSecret, value: e.target.value })
                  }
                  rows={10}
                  placeholder='{"key": "value"}'
                />
              </div>

              <div className={styles.modalFooter}>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleUpdateSecret}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default AWSSecretsPage
