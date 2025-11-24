import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { OrganizationApi, type Organization } from '../utils/organizationApi'
import { useAuth } from './AuthContext'
import { buildApiUrl } from '../config/api'

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
      let orgs: Organization[] = []
      
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await fetch(buildApiUrl('me/organizations'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            orgs = data.organizations || []
          } else {
            orgs = await OrganizationApi.getAll()
          }
        } else {
          orgs = await OrganizationApi.getAll()
        }
      } catch (error) {
        console.error('Failed to load organizations:', error)
        try {
          orgs = await OrganizationApi.getAll()
        } catch (e) {
          orgs = []
        }
      }
      
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

