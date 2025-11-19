import { NavLink } from 'react-router-dom'
import {
  Home,
  LayoutDashboard,
  Box,
  Server,
  Activity,
  Shield,
  GitBranch,
  Settings,
  DollarSign,
  BarChart3,
  Plug,
  FileText,
  Github,
  Network
} from 'lucide-react'
import styles from './Sidebar.module.css'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home size={20} /> },
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/services', label: 'Serviços', icon: <Box size={20} /> },
  { path: '/kubernetes', label: 'Kubernetes', icon: <Server size={20} /> },
  { path: '/github', label: 'Repositórios', icon: <Github size={20} /> },
  { path: '/ci', label: 'CI/CD', icon: <GitBranch size={20} /> },
  { path: '/observability', label: 'Observabilidade', icon: <Activity size={20} /> },
  { path: '/quality', label: 'Qualidade', icon: <Shield size={20} /> },
  { path: '/finops', label: 'FinOps', icon: <DollarSign size={20} /> },
  { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { path: '/techdocs', label: 'TechDocs', icon: <FileText size={20} /> },
  { path: '/diagrams', label: 'Diagramas', icon: <Network size={20} /> },
  { path: '/templates', label: 'Templates', icon: <FileText size={20} /> },
  { path: '/integrations', label: 'Integrações', icon: <Plug size={20} /> },
  { path: '/settings', label: 'Configurações', icon: <Settings size={20} /> },
]

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
