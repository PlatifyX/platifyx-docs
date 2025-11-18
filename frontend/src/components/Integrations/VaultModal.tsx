import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import styles from './AzureDevOpsModal.module.css'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

interface VaultModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function VaultModal({ integration, isCreating, onSave, onClose }: VaultModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [address, setAddress] = useState(integration?.config?.address || '')
  const [token, setToken] = useState(integration?.config?.token || '')
  const [namespace, setNamespace] = useState(integration?.config?.namespace || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!address || !token) {
      alert('Preencha Address e Token para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          token,
          namespace: namespace || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const statusMsg = data.sealed ? ' (Sealed)' : data.initialized ? ' (Unsealed)' : ''
        const versionMsg = data.version ? ` Versão: ${data.version}` : ''
        setTestResult({
          success: true,
          message: `Conexão estabelecida!${statusMsg}${versionMsg}`
        })
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Falha ao conectar'
        setTestResult({ success: false, message: errorMsg })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erro ao testar conexão: ${err.message || 'Verifique se o backend está rodando'}`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCreating && !name) {
      alert('Nome da integração é obrigatório')
      return
    }

    if (!address || !token) {
      alert('Address e Token são obrigatórios')
      return
    }

    if (!testResult?.success) {
      alert('Por favor, teste a conexão antes de salvar')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name || 'Vault Integration',
        config: {
          address,
          token,
          namespace: namespace || undefined,
        },
      })
      onClose()
    } catch (err) {
      console.error('Error saving integration:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isCreating ? 'Nova Integração Vault' : 'Editar Integração Vault'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome da Integração *</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Vault Production" required={isCreating} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Vault Address *</label>
            <input type="url" id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="https://vault.example.com:8200" required />
            <small>URL completa do Vault (ex: https://vault.example.com:8200)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="token">Vault Token *</label>
            <input type="password" id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="s.xxxxxxxxxxxxxxxxxxxxxxxx" required />
            <small>Token de autenticação do Vault</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="namespace">Namespace (opcional)</label>
            <input type="text" id="namespace" value={namespace} onChange={(e) => setNamespace(e.target.value)} placeholder="my-namespace" />
            <small>Vault Enterprise namespace (deixe vazio se não usar)</small>
          </div>

          {testResult && (
            <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
              {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.testButton} onClick={handleTestConnection} disabled={testing || !address || !token}>
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            <div className={styles.actionButtons}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
              <button type="submit" className={styles.saveButton} disabled={saving || !testResult?.success}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VaultModal
