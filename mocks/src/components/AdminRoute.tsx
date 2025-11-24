import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

const ADMIN_EMAIL = 'admin@platifyx.com'

function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
          <p className="text-sm text-gray-500">Apenas o usuário administrador pode acessar esta funcionalidade.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute

