import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import KubernetesPage from './pages/KubernetesPage'
import AzureDevOpsPage from './pages/AzureDevOpsPage'
import IntegrationsPage from './pages/IntegrationsPage'
import QualityPage from './pages/QualityPage'
import FinOpsPage from './pages/FinOpsPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/kubernetes" element={<KubernetesPage />} />
          <Route path="/ci" element={<AzureDevOpsPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/finops" element={<FinOpsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
