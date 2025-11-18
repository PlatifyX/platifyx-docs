import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import KubernetesPage from './pages/KubernetesPage'
import GrafanaPage from './pages/GrafanaPage'
import GitHubPage from './pages/GitHubPage'
import AzureDevOpsPage from './pages/AzureDevOpsPage'
import IntegrationsPage from './pages/IntegrationsPage'
import ServiceTemplatesPage from './pages/ServiceTemplatesPage'
import QualityPage from './pages/QualityPage'
import FinOpsPageEnhanced from './pages/FinOpsPageEnhanced'
import TechDocsPage from './pages/TechDocsPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/kubernetes" element={<KubernetesPage />} />
          <Route path="/grafana" element={<GrafanaPage />} />
          <Route path="/github" element={<GitHubPage />} />
          <Route path="/ci" element={<AzureDevOpsPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/finops" element={<FinOpsPageEnhanced />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/techdocs" element={<TechDocsPage />} />
          <Route path="/templates" element={<ServiceTemplatesPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
