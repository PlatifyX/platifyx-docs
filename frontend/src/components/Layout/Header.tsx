import { Bell, Search, User } from 'lucide-react'
import styles from './Header.module.css'

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <img
          src="public/logos/platifyx1.png"
          alt="PlatifyX"
          className={styles.logoImage}
        />
      </div>

      <div className={styles.search}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar serviços, documentação..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton} title="Notificações">
          <Bell size={20} />
        </button>
        <button className={styles.iconButton} title="Perfil">
          <User size={20} />
        </button>
      </div>
    </header>
  )
}

export default Header
