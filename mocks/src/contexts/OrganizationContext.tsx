import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type Organization } from '../utils/organizationApi'
import { useAuth } from './AuthContext'
import { getMockOrganizations } from '../mocks/data/organizations'

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  setCurrentOrganization: (org: Organization | null) => void
  loading: boolean
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

const ORGANIZATION_STORAGE_KEY = 'platifyx_current_organization'

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const loadOrganizations = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Usando dados mockados
      const orgs = await getMockOrganizations()
      setOrganizations(orgs)

      const savedOrgUUID = localStorage.getItem(ORGANIZATION_STORAGE_KEY)
      if (savedOrgUUID) {
        const savedOrg = orgs.find((org) => org.uuid === savedOrgUUID)
        if (savedOrg) {
          setCurrentOrganizationState(savedOrg)
        } else {
          localStorage.removeItem(ORGANIZATION_STORAGE_KEY)
        }
      } else if (orgs.length > 0) {
        setCurrentOrganizationState(orgs[0])
        localStorage.setItem(ORGANIZATION_STORAGE_KEY, orgs[0].uuid)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [isAuthenticated, user])

  const setCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganizationState(org)
    if (org) {
      localStorage.setItem(ORGANIZATION_STORAGE_KEY, org.uuid)
    } else {
      localStorage.removeItem(ORGANIZATION_STORAGE_KEY)
    }
  }

  const refreshOrganizations = async () => {
    await loadOrganizations()
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        setCurrentOrganization,
        loading,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
