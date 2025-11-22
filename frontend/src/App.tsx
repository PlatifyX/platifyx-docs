import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SSOCallbackPage from './pages/SSOCallbackPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import KubernetesPage from './pages/KubernetesPage'
import ReposPage from './pages/ReposPage'
import AzureDevOpsPage from './pages/AzureDevOpsPage'
import IntegrationsPage from './pages/IntegrationsPage'
import InfrastructureTemplatesPage from './pages/InfrastructureTemplatesPage'
import QualityPage from './pages/QualityPage'
import FinOpsPageEnhanced from './pages/FinOpsPageEnhanced'
import TechDocsPage from './pages/TechDocsPage'
import ObservabilityPage from './pages/ObservabilityPage'
import SettingsPage from './pages/SettingsPage'

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()

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

  return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rota raiz - redireciona para login ou home */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback/:provider" element={<SSOCallbackPage />} />

          {/* Rotas protegidas */}
          <Route path="/home" element={
            <PrivateRoute>
              <Layout>
                <HomePage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/services" element={
            <PrivateRoute>
              <Layout>
                <ServicesPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/kubernetes" element={
            <PrivateRoute>
              <Layout>
                <KubernetesPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/repos" element={
            <PrivateRoute>
              <Layout>
                <ReposPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/ci" element={
            <PrivateRoute>
              <Layout>
                <AzureDevOpsPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/observability" element={
            <PrivateRoute>
              <Layout>
                <ObservabilityPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/quality" element={
            <PrivateRoute>
              <Layout>
                <QualityPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/finops" element={
            <PrivateRoute>
              <Layout>
                <FinOpsPageEnhanced />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/integrations" element={
            <PrivateRoute>
              <Layout>
                <IntegrationsPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/techdocs" element={
            <PrivateRoute>
              <Layout>
                <TechDocsPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/infrastructure-templates" element={
            <PrivateRoute>
              <Layout>
                <InfrastructureTemplatesPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
