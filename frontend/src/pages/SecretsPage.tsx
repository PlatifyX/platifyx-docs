import { useState, useEffect } from 'react'
import { Key, Shield, AlertCircle } from 'lucide-react'
import AWSSecretsTab from '../components/Secrets/AWSSecretsTab'
import VaultTab from '../components/Secrets/VaultTab'
import { IntegrationApi, type Integration } from '../utils/integrationApi'

type TabType = 'aws' | 'vault'

function SecretsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('aws')
  const [awsIntegrations, setAwsIntegrations] = useState<Integration[]>([])
  const [vaultIntegrations, setVaultIntegrations] = useState<Integration[]>([])
  const [selectedAwsId, setSelectedAwsId] = useState<number | null>(null)
  const [selectedVaultId, setSelectedVaultId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const integrations = await IntegrationApi.getAll()

      // Filtrar integrações AWS (tipo 'aws' usado para FinOps)
      const awsOnes = integrations.filter(i => i.type === 'aws' && i.enabled)
      setAwsIntegrations(awsOnes)
      if (awsOnes.length > 0 && !selectedAwsId) {
        setSelectedAwsId(awsOnes[0].id)
      }

      // Filtrar integrações Vault
      const vaultOnes = integrations.filter(i => i.type === 'vault' && i.enabled)
      setVaultIntegrations(vaultOnes)
      if (vaultOnes.length > 0 && !selectedVaultId) {
        setSelectedVaultId(vaultOnes[0].id)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Key size={32} className="text-primary" />
            Gerenciamento de Secrets
          </h1>
          <p className="text-muted mt-2">
            Gerencie seus secrets de forma segura com AWS Secrets Manager e HashiCorp Vault
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="border-b border-border">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('aws')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'aws'
                  ? 'text-primary border-b-2 border-primary bg-surface-light'
                  : 'text-muted hover:text-white hover:bg-surface-light'
              }`}
            >
              <Shield size={20} />
              AWS Secrets Manager
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'vault'
                  ? 'text-primary border-b-2 border-primary bg-surface-light'
                  : 'text-muted hover:text-white hover:bg-surface-light'
              }`}
            >
              <Key size={20} />
              HashiCorp Vault
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'aws' && (
            <>
              {awsIntegrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle size={48} className="text-yellow-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Nenhuma integração AWS configurada
                  </h3>
                  <p className="text-muted mb-4">
                    Configure uma integração AWS na página de Integrações para usar o Secrets Manager
                  </p>
                  <a
                    href="/integrations"
                    className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
                  >
                    Ir para Integrações
                  </a>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Selecione a conta AWS:
                    </label>
                    <select
                      value={selectedAwsId || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAwsId(Number(e.target.value))}
                      className="px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                    >
                      {awsIntegrations.map((integration) => (
                        <option key={integration.id} value={integration.id}>
                          {integration.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedAwsId && <AWSSecretsTab integrationId={selectedAwsId} />}
                </>
              )}
            </>
          )}

          {activeTab === 'vault' && (
            <>
              {vaultIntegrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle size={48} className="text-yellow-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Nenhuma integração Vault configurada
                  </h3>
                  <p className="text-muted mb-4">
                    Configure uma integração Vault na página de Integrações
                  </p>
                  <a
                    href="/integrations"
                    className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
                  >
                    Ir para Integrações
                  </a>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Selecione o Vault:
                    </label>
                    <select
                      value={selectedVaultId || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedVaultId(Number(e.target.value))}
                      className="px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                    >
                      {vaultIntegrations.map((integration) => (
                        <option key={integration.id} value={integration.id}>
                          {integration.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedVaultId && <VaultTab integrationId={selectedVaultId} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretsPage
