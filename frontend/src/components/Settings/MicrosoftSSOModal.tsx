import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import styles from './SSOModal.module.css'
import { buildApiUrl } from '../../config/api'

interface SSOConfig {
  id?: number
  provider: string
  enabled: boolean
  config: any
}

interface MicrosoftSSOModalProps {
  config: SSOConfig | null
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function MicrosoftSSOModal({ config, onSave, onClose }: MicrosoftSSOModalProps) {
  const [clientId, setClientId] = useState(config?.config?.clientId || '')
  const [clientSecret, setClientSecret] = useState(config?.config?.clientSecret || '')
  const [tenantId, setTenantId] = useState(config?.config?.tenantId || 'common')
  const [redirectUri, setRedirectUri] = useState(config?.config?.redirectUri || window.location.origin + '/auth/microsoft/callback')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!clientId || !clientSecret || !tenantId) {
      alert('Preencha todos os campos obrigatórios para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // TODO: Implementar endpoint real de teste
      const response = await fetch(buildApiUrl('settings/sso/test/microsoft'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          tenantId,
          redirectUri
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Configuração válida! Azure AD configurado corretamente'
        })
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Falha ao validar configuração'
        setTestResult({ success: false, message: errorMsg })
      }
    } catch (err: any) {
      console.error('Connection test error:', err)
      setTestResult({
        success: false,
        message: `Erro ao testar configuração: ${err.message || 'Verifique se o backend está rodando'}`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId || !clientSecret || !tenantId) {
      alert('Todos os campos obrigatórios devem ser preenchidos')
      return
    }

    if (!testResult?.success) {
      alert('Por favor, teste a configuração antes de salvar')
      return
    }

    setSaving(true)
    try {
      await onSave({
        provider: 'microsoft',
        config: {
          clientId,
          clientSecret,
          tenantId,
          redirectUri
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
          <div className={styles.headerTitle}>
            <span className={styles.providerIcon}>🔷</span>
            <h2 className={styles.title}>
              {config ? 'Reconfigurar Microsoft SSO' : 'Configurar Microsoft SSO'}
            </h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="clientId" className={styles.label}>
              Application (Client) ID *
            </label>
            <input
              id="clientId"
              type="text"
              className={styles.input}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="12345678-1234-1234-1234-123456789012"
              required
            />
            <p className={styles.hint}>
              Obtenha no <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className={styles.link}>Azure Portal</a> → App registrations → sua aplicação → Overview
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientSecret" className={styles.label}>
              Client Secret *
            </label>
            <input
              id="clientSecret"
              type="password"
              className={styles.input}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className={styles.hint}>
              Gere em Certificates & secrets → Client secrets → New client secret
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tenantId" className={styles.label}>
              Directory (Tenant) ID *
            </label>
            <input
              id="tenantId"
              type="text"
              className={styles.input}
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="common ou 87654321-4321-4321-4321-210987654321"
              required
            />
            <p className={styles.hint}>
              Use <code>common</code> para contas pessoais e organizacionais, ou o Tenant ID específico para restringir à sua organização
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="redirectUri" className={styles.label}>
              Redirect URI *
            </label>
            <input
              id="redirectUri"
              type="url"
              className={styles.input}
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              placeholder={window.location.origin + '/auth/microsoft/callback'}
              required
            />
            <p className={styles.hint}>
              Esta URI deve estar configurada em Authentication → Redirect URIs no Azure Portal. Geralmente é <code>{window.location.origin}/auth/microsoft/callback</code>
            </p>
          </div>

          <div className={styles.infoBox}>
            <p><strong>📋 Passos para configurar:</strong></p>
            <ol className={styles.stepsList}>
              <li>Acesse o <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className={styles.link}>Azure Portal</a></li>
              <li>Vá em Azure Active Directory → App registrations</li>
              <li>Clique em "New registration" e crie uma aplicação</li>
              <li>Em Authentication, adicione a Redirect URI (tipo: Web)</li>
              <li>Em Certificates & secrets, crie um novo Client Secret</li>
              <li>Em API permissions, adicione:
                <ul>
                  <li>Microsoft Graph → User.Read (delegated)</li>
                  <li>Microsoft Graph → openid, profile, email (delegated)</li>
                </ul>
              </li>
              <li>Copie Application ID, Tenant ID e Secret para os campos acima</li>
            </ol>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !clientId || !clientSecret || !tenantId}
            >
              {testing ? 'Testando...' : 'Testar Configuração'}
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
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MicrosoftSSOModal
