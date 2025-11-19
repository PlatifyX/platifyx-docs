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

interface RedisModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function RedisModal({ integration, isCreating, onSave, onClose }: RedisModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [host, setHost] = useState(integration?.config?.host || 'localhost')
  const [port, setPort] = useState(integration?.config?.port || 6379)
  const [password, setPassword] = useState(integration?.config?.password || '')
  const [db, setDb] = useState(integration?.config?.db || 0)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!host) {
      alert('Preencha o host para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/redis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host,
          port: parseInt(port.toString()),
          password,
          db: parseInt(db.toString()),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida! (DB: ${data.db})`
        })
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Falha ao conectar'
        setTestResult({ success: false, message: errorMsg })
      }
    } catch (err: any) {
      console.error('Connection test error:', err)
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

    if (!host) {
      alert('Host é obrigatório')
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
          host,
          port: parseInt(port.toString()),
          password: password || undefined,
          db: parseInt(db.toString()),
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
            {isCreating ? 'Nova Integração Redis' : 'Configurar Redis'}
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
                placeholder="Ex: Redis - Cache Principal"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="host" className={styles.label}>
              Host *
            </label>
            <input
              id="host"
              type="text"
              className={styles.input}
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="localhost"
              required
            />
            <p className={styles.hint}>
              Endereço do servidor Redis (ex: localhost, redis.example.com)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="port" className={styles.label}>
              Porta *
            </label>
            <input
              id="port"
              type="number"
              className={styles.input}
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value))}
              placeholder="6379"
              required
            />
            <p className={styles.hint}>
              Porta do Redis (padrão: 6379)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha (opcional)
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
            />
            <p className={styles.hint}>
              Deixe em branco se não houver senha configurada
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="db" className={styles.label}>
              Database (opcional)
            </label>
            <input
              id="db"
              type="number"
              className={styles.input}
              value={db}
              onChange={(e) => setDb(parseInt(e.target.value))}
              placeholder="0"
              min="0"
              max="15"
            />
            <p className={styles.hint}>
              Número do database Redis (0-15, padrão: 0)
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !host}
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

export default RedisModal
