import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { API_CONFIG } from '../config/api'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resetUrl, setResetUrl] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar reset de senha')
      }

      setSuccess(true)
      // Em desenvolvimento, mostra o link de reset
      if (data.reset_url) {
        setResetUrl(data.reset_url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar reset de senha')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-[#2A2A2A] rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Email Enviado!
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Verifique sua caixa de entrada
              </p>
            </div>

            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-200 text-center">
                Se existir uma conta com o email <strong>{email}</strong>, você receberá
                um link para redefinir sua senha.
              </p>
            </div>

            {resetUrl && (
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
                <p className="text-xs text-blue-200 text-center font-semibold mb-2">
                  Modo Desenvolvimento - Link de Reset:
                </p>
                <a
                  href={resetUrl}
                  className="text-xs text-blue-300 hover:text-blue-200 break-all block text-center underline"
                >
                  {resetUrl}
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-all font-medium text-sm"
            >
              <ArrowLeft size={16} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-[#2A2A2A] rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              Esqueceu sua senha?
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Sem problemas! Insira seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-500 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-600 rounded-lg placeholder-gray-400 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <img 
                      src="/logos/platifyx-logo-white.png" 
                      alt="PlatifyX Logo" 
                      className="animate-spin -ml-1 mr-3 h-5 w-5"
                    />
                    Enviando...
                  </span>
                ) : (
                  'Enviar link de reset'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-all font-medium text-sm"
            >
              <ArrowLeft size={16} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
