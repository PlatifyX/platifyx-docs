import { useState } from 'react'
import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center px-6 gap-6 fixed top-0 left-0 right-0 z-[100]">
      <div className="flex items-center min-w-[200px]">
        <img
          src="public/logos/platifyx-name-white.png"
          alt="PlatifyX"
          className="h-8 w-auto"
        />
      </div>

      <div className="flex-1 max-w-[600px] flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-2 text-muted-foreground focus-within:border-primary focus-within:text-foreground">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar serviços, documentação..."
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="bg-transparent border-none text-muted-foreground p-2 rounded-md flex items-center justify-center transition-all hover:bg-surface-light hover:text-foreground" title="Notificações">
          <Bell size={20} />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="bg-transparent border-none text-muted-foreground p-2 rounded-md flex items-center gap-2 transition-all hover:bg-surface-light hover:text-foreground"
            title="Perfil"
          >
            <User size={20} />
            {user && (
              <span className="text-sm font-medium text-foreground hidden md:inline">
                {user.name}
              </span>
            )}
          </button>

          {showUserMenu && (
            <>
              {/* Overlay to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg z-20">
                {user && (
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">
                        {user.role}
                      </span>
                    </p>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/settings')
                    }}
                    className="w-full px-4 py-2 text-sm text-foreground hover:bg-surface-light flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Configurações
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-red-500 hover:bg-surface-light flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
