import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import styles from './AzureDevOpsModal.module.css'
import { buildApiUrl } from '../../config/api'

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
      const response = await fetch(buildApiUrl('integrations/test/vault'), {
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
        name: name || integration?.name,
        config: {
          address,
          token,
          namespace: namespace || undefined,
        },
      })
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isCreating ? 'Nova Integração Vault' : 'Configurar Vault'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isCreating && (
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Nome da Integração *
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Vault - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="address" className={styles.label}>
              Vault Address *
            </label>
            <input
              id="address"
              type="url"
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="https://vault.example.com:8200"
              required
            />
            <p className={styles.hint}>
              URL completa do Vault (ex: https://vault.example.com:8200)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="token" className={styles.label}>
              Vault Token *
            </label>
            <input
              id="token"
              type="password"
              className={styles.input}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="s.xxxxxxxxxxxxxxxxxxxxxxxx"
              required
            />
            <p className={styles.hint}>
              Token de autenticação do Vault
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="namespace" className={styles.label}>
              Namespace (opcional)
            </label>
            <input
              id="namespace"
              type="text"
              className={styles.input}
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="my-namespace"
            />
            <p className={styles.hint}>
              Vault Enterprise namespace (deixe vazio se não usar)
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !address || !token}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            {testResult && (
              <div className={testResult.success ? styles.testSuccess : styles.testError}>
                {testResult.success ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VaultModal
