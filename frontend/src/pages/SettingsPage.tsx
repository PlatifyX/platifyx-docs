import { useState, useEffect } from 'react'
import { Settings, Shield, Key, FileText, CheckCircle, XCircle } from 'lucide-react'
import GoogleSSOModal from '../components/Settings/GoogleSSOModal'
import MicrosoftSSOModal from '../components/Settings/MicrosoftSSOModal'
import RBACModal from '../components/Settings/RBACModal'
import SettingCard from '../components/Settings/SettingCard'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import { buildApiUrl } from '../config/api'
import styles from './SettingsPage.module.css'

interface SSOConfig {
  id?: number
  provider: 'google' | 'microsoft'
  enabled: boolean
  config: any
}

interface SettingsData {
  sso: {
    google: SSOConfig | null
    microsoft: SSOConfig | null
  }
  rbac: {
    enabled: boolean
    customProfiles: number
  }
  mfa: {
    enabled: boolean
    methods: string[]
  }
}

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    sso: {
      google: null,
      microsoft: null
    },
    rbac: {
      enabled: false,
      customProfiles: 0
    },
    mfa: {
      enabled: false,
      methods: []
    }
  })
  const [loading, setLoading] = useState(true)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [showMicrosoftModal, setShowMicrosoftModal] = useState(false)
  const [showRBACModal, setShowRBACModal] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Fetch SSO settings
      const ssoResponse = await fetch(buildApiUrl('settings/sso'))
      const ssoData = await ssoResponse.json()

      // Fetch RBAC stats
      const rbacResponse = await fetch(buildApiUrl('rbac/users/stats'))
      const rbacStats = await rbacResponse.json()

      // Process SSO data
      const google = ssoData?.find((s: any) => s.provider === 'google') || null
      const microsoft = ssoData?.find((s: any) => s.provider === 'microsoft') || null

      setSettings({
        sso: {
          google,
          microsoft
        },
        rbac: {
          enabled: rbacStats.totalUsers > 0,
          customProfiles: rbacStats.totalRoles - 4 // Subtract system roles
        },
        mfa: {
          enabled: false,
          methods: []
        }
      })
    } catch (err) {
      console.error('Error fetching settings:', err)
      // Fallback to empty data on error
      setSettings({
        sso: { google: null, microsoft: null },
        rbac: { enabled: false, customProfiles: 0 },
        mfa: { enabled: false, methods: [] }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGoogleSSO = async (data: any) => {
    try {
      const response = await fetch(buildApiUrl('settings/sso'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          enabled: true,
          config: data
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar configuração')
      }

      await fetchSettings()
      setShowGoogleModal(false)
    } catch (err: any) {
      console.error('Error saving Google SSO:', err)
      throw err
    }
  }

  const handleSaveMicrosoftSSO = async (data: any) => {
    try {
      const response = await fetch(buildApiUrl('settings/sso'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'microsoft',
          enabled: true,
          config: data
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar configuração')
      }

      await fetchSettings()
      setShowMicrosoftModal(false)
    } catch (err: any) {
      console.error('Error saving Microsoft SSO:', err)
      throw err
    }
  }

  const handleToggleSSO = async (provider: 'google' | 'microsoft') => {
    try {
      const currentConfig = provider === 'google' ? settings.sso.google : settings.sso.microsoft
      if (!currentConfig) {
        alert('Configure o SSO antes de ativar/desativar')
        return
      }

      const response = await fetch(buildApiUrl(`settings/sso/${provider}/enabled`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !currentConfig.enabled
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status')
      }

      await fetchSettings()
    } catch (err) {
      console.error(`Error toggling ${provider} SSO:`, err)
      alert(`Erro ao alterar status do SSO ${provider}`)
    }
  }

  const handleDeleteSSO = async (provider: 'google' | 'microsoft') => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover a configuração de SSO ${provider}? Esta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(buildApiUrl(`settings/sso/${provider}`), {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao deletar configuração')
      }

      await fetchSettings()
    } catch (err) {
      console.error(`Error deleting ${provider} SSO:`, err)
      alert(`Erro ao deletar configuração de SSO ${provider}`)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className={styles.loading}>Carregando configurações...</div>
      </PageContainer>
    )
  }

  const googleConfig = settings.sso.google
  const microsoftConfig = settings.sso.microsoft

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Settings}
        title="Configurações"
        subtitle="Gerencie autenticação, permissões e auditoria"
      />

      {/* SSO Section */}
      <Section title="Single Sign-On (SSO)" icon="🔐" spacing="lg">
        <p className={styles.sectionDescription} style={{ marginBottom: '1.5rem' }}>
          Configure autenticação via Google Workspace ou Microsoft Azure AD
        </p>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <CheckCircle size={20} className={styles.statIconSuccess} />
            <span>
              {[googleConfig?.enabled, microsoftConfig?.enabled].filter(Boolean).length} Ativo(s)
            </span>
          </div>
          <div className={styles.statItem}>
            <XCircle size={20} className={styles.statIconInactive} />
            <span>
              {2 - [googleConfig?.enabled, microsoftConfig?.enabled].filter(Boolean).length} Inativo(s)
            </span>
          </div>
        </div>

        <div className={styles.grid}>
          <SettingCard
            title="Google Workspace"
            description="Login via Google com suporte a domínios organizacionais"
            icon="🔵"
            configured={googleConfig !== null}
            enabled={googleConfig?.enabled || false}
            onConfigure={() => setShowGoogleModal(true)}
            onToggle={() => handleToggleSSO('google')}
            onDelete={() => handleDeleteSSO('google')}
            features={[
              'Autenticação OAuth 2.0',
              'Suporte a Google Workspace',
              'Validação de domínio',
              'Perfis automáticos'
            ]}
          />

          <SettingCard
            title="Microsoft Azure AD"
            description="Login via Microsoft com integração Azure Active Directory"
            icon="🔷"
            configured={microsoftConfig !== null}
            enabled={microsoftConfig?.enabled || false}
            onConfigure={() => setShowMicrosoftModal(true)}
            onToggle={() => handleToggleSSO('microsoft')}
            onDelete={() => handleDeleteSSO('microsoft')}
            features={[
              'Autenticação Azure AD',
              'Suporte a Microsoft 365',
              'Conditional Access',
              'Grupos do AD'
            ]}
          />
        </div>
      </Section>

      {/* RBAC Section */}
      <Section title="Controle de Acesso (RBAC)" icon="🛡️" spacing="lg">
        <p className={styles.sectionDescription} style={{ marginBottom: '1.5rem' }}>
          Gerencie perfis, permissões e grupos de usuários
        </p>

        <div className={styles.featureBox}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>Role-Based Access Control</h3>
            <ul className={styles.featureList}>
              <li>✓ Perfis customizados</li>
              <li>✓ Permissões granulares</li>
              <li>✓ Grupos e equipes</li>
              <li>✓ Herança de permissões</li>
            </ul>
            <div className={styles.featureStats}>
              <span className={styles.featureStat}>
                <strong>{settings.rbac.customProfiles}</strong> perfis personalizados
              </span>
              <span className={styles.featureStatus}>
                {settings.rbac.enabled ? (
                  <span className={styles.statusEnabled}>
                    <CheckCircle size={16} /> Ativo
                  </span>
                ) : (
                  <span className={styles.statusDisabled}>
                    <XCircle size={16} /> Inativo
                  </span>
                )}
              </span>
            </div>
          </div>
          <button className={styles.featureButton} onClick={() => setShowRBACModal(true)}>
            Configurar RBAC
          </button>
        </div>
      </Section>

      {/* MFA Section */}
      <Section title="Autenticação Multi-Fator (MFA)" icon="🔒" spacing="lg">
        <p className={styles.sectionDescription} style={{ marginBottom: '1.5rem' }}>
          Configure autenticação de dois fatores para maior segurança
        </p>

        <div className={styles.featureBox}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>Multi-Factor Authentication</h3>
            <ul className={styles.featureList}>
              <li>✓ Aplicativos autenticadores (TOTP)</li>
              <li>✓ SMS e Email</li>
              <li>✓ Chaves de segurança (FIDO2)</li>
              <li>✓ Backup codes</li>
            </ul>
            <div className={styles.featureStats}>
              <span className={styles.featureStat}>
                <strong>{settings.mfa.methods.length}</strong> método(s) configurado(s)
              </span>
              <span className={styles.featureStatus}>
                {settings.mfa.enabled ? (
                  <span className={styles.statusEnabled}>
                    <CheckCircle size={16} /> Ativo
                  </span>
                ) : (
                  <span className={styles.statusDisabled}>
                    <XCircle size={16} /> Inativo
                  </span>
                )}
              </span>
            </div>
          </div>
          <button className={styles.featureButton} disabled>
            Configurar MFA
            <span className={styles.comingSoon}>Em breve</span>
          </button>
        </div>
      </Section>

      {/* Audit Section */}
      <Section title="Auditoria" icon="📝" spacing="lg">
        <p className={styles.sectionDescription} style={{ marginBottom: '1.5rem' }}>
          Visualize logs de atividades e alterações no sistema
        </p>

        <div className={styles.featureBox}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>Logs de Auditoria</h3>
            <ul className={styles.featureList}>
              <li>✓ Registro de todas as ações</li>
              <li>✓ Rastreabilidade completa</li>
              <li>✓ Exportação de relatórios</li>
              <li>✓ Retenção configurável</li>
            </ul>
          </div>
          <button className={styles.featureButton} disabled>
            Ver Logs
            <span className={styles.comingSoon}>Em breve</span>
          </button>
        </div>
      </Section>

      {/* Modals */}
      {showGoogleModal && (
        <GoogleSSOModal
          config={googleConfig}
          onSave={handleSaveGoogleSSO}
          onClose={() => setShowGoogleModal(false)}
        />
      )}

      {showMicrosoftModal && (
        <MicrosoftSSOModal
          config={microsoftConfig}
          onSave={handleSaveMicrosoftSSO}
          onClose={() => setShowMicrosoftModal(false)}
        />
      )}

      {showRBACModal && (
        <RBACModal
          onClose={() => {
            setShowRBACModal(false)
            fetchSettings()
          }}
        />
      )}
    </PageContainer>
  )
}

export default SettingsPage
