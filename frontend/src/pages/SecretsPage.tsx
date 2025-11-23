import { useState } from 'react'
import { Key, Shield } from 'lucide-react'
import AWSSecretsTab from '../components/Secrets/AWSSecretsTab'
import VaultTab from '../components/Secrets/VaultTab'

type TabType = 'aws' | 'vault'

function SecretsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('aws')

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
          {activeTab === 'aws' && <AWSSecretsTab />}
          {activeTab === 'vault' && <VaultTab />}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border p-6">
        <h3 className="text-lg font-bold text-white mb-4">ℹ️ Informações Importantes</h3>
        <div className="space-y-3 text-sm text-muted">
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <p>
              <strong className="text-white">AWS Secrets Manager:</strong> Armazene e gerencie
              credenciais, chaves de API e outros dados sensíveis na AWS com rotação automática.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <p>
              <strong className="text-white">HashiCorp Vault:</strong> Solução enterprise para
              gerenciamento de secrets com suporte a múltiplos backends e controle de acesso granular.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-400 font-bold">⚠️</span>
            <p className="text-red-400">
              <strong>Atenção:</strong> Nunca compartilhe ou exponha valores de secrets. Utilize
              sempre permissões adequadas e auditoria de acesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecretsPage
