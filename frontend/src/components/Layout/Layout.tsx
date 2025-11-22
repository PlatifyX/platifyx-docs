import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Sidebar />
      <main className="mt-16 ml-[260px] p-6 min-h-[calc(100vh-4rem)] bg-background">
        {children}
      </main>
    </div>
  )
}

export default Layout
