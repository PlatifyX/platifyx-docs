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
  Network,
  Boxes
} from 'lucide-react'

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
  { path: '/techdocs', label: 'Documentação', icon: <FileText size={20} /> },
  { path: '/diagrams', label: 'Diagramas', icon: <Network size={20} /> },
  { path: '/infrastructure-templates', label: 'Templates', icon: <Boxes size={20} /> },
  { path: '/integrations', label: 'Integrações', icon: <Plug size={20} /> },
  { path: '/settings', label: 'Configurações', icon: <Settings size={20} /> },
]

function Sidebar() {
  return (
    <aside className="w-[260px] bg-surface border-r border-border fixed top-16 left-0 bottom-0 overflow-y-auto z-[90]">
      <nav className="p-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 py-2.5 px-3 rounded-lg no-underline transition-all text-sm font-medium text-white ${
                isActive
                  ? 'bg-primary hover:bg-primary-dark'
                  : 'hover:bg-surface-light'
              }`
            }
          >
            <span className="flex items-center justify-center min-w-[20px]">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
