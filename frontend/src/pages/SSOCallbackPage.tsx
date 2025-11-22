import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { API_CONFIG } from '../config/api'
import { useAuth } from '../contexts/AuthContext'

function SSOCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      // Verificar se há token nos query params (vindo do backend)
      const token = searchParams.get('token')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        setProcessing(false)
        return
      }

      if (token) {
        // Token direto do backend via redirect
        localStorage.setItem('token', token)

        // Aguardar um pouco para garantir que o token foi salvo
        setTimeout(() => {
          window.location.href = '/home'
        }, 1000)
        return
      }

      // Se não há token, verificar se há code (fluxo OAuth2 tradicional)
      const code = searchParams.get('code')
      const provider = searchParams.get('provider') ||
                      window.location.pathname.split('/').pop()

      if (!code) {
        setError('Código de autorização não encontrado')
        setProcessing(false)
        return
      }

      try {
        // Enviar code para o backend processar
        const response = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/callback/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Falha na autenticação SSO')
        }

        const data = await response.json()

        if (data.token) {
          localStorage.setItem('token', data.token)

          setTimeout(() => {
            window.location.href = '/home'
          }, 1000)
        } else {
          throw new Error('Token não recebido do servidor')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar autenticação SSO')
        setProcessing(false)
      }
    }

    processCallback()
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Erro na Autenticação
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Não foi possível completar o login com SSO
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 text-center">{error}</p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all font-medium text-sm"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {processing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Processando...
                </h2>
                <p className="text-sm text-gray-600">
                  Aguarde enquanto completamos sua autenticação
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Autenticação Bem-sucedida!
                </h2>
                <p className="text-sm text-gray-600">
                  Redirecionando...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SSOCallbackPage
