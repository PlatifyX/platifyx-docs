import { useState } from 'react'
import { apiFetch } from '../config/api'

interface TestResult {
  success: boolean
  message: string
}

interface UseIntegrationTestReturn {
  testing: boolean
  testResult: TestResult | null
  testConnection: (integrationType: string, config: any) => Promise<void>
  resetTest: () => void
}

export function useIntegrationTest(): UseIntegrationTestReturn {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const testConnection = async (integrationType: string, config: any) => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await apiFetch(`integrations/test/${integrationType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: data.message || 'Conex�o estabelecida com sucesso!',
        })
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Falha ao conectar'
        setTestResult({ success: false, message: errorMsg })
      }
    } catch (err: any) {
      console.error('Connection test error:', err)
      setTestResult({
        success: false,
        message: `Erro ao testar conex�o: ${err.message || 'Verifique se o backend est� rodando'}`,
      })
    } finally {
      setTesting(false)
    }
  }

  const resetTest = () => {
    setTestResult(null)
  }

  return {
    testing,
    testResult,
    testConnection,
    resetTest,
  }
}
