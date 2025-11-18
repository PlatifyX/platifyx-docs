import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import KubernetesPage from './pages/KubernetesPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/kubernetes" element={<KubernetesPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
