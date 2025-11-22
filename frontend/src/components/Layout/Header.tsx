import { Bell, Search, User } from 'lucide-react'

function Header() {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center px-6 gap-6 fixed top-0 left-0 right-0 z-[100]">
      <div className="flex items-center min-w-[200px]">
        <img
          src="public/logos/platifyx.png"
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
        <button className="bg-transparent border-none text-muted-foreground p-2 rounded-md flex items-center justify-center transition-all hover:bg-surface-light hover:text-foreground" title="Perfil">
          <User size={20} />
        </button>
      </div>
    </header>
  )
}

export default Header
