const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.platifyx.com'
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'
const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || 'https://app.platifyx.com'

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  VERSION: API_VERSION,
  APP_URL: APP_BASE_URL,
  ENDPOINTS: {
    INTEGRATIONS: `${API_BASE_URL}/api/${API_VERSION}/integrations`,
    TEMPLATES: `${API_BASE_URL}/api/${API_VERSION}/templates`,
    AUTH: `${API_BASE_URL}/api/${API_VERSION}/auth`,
    SETTINGS: {
      USERS: `${API_BASE_URL}/api/${API_VERSION}/settings/users`,
      ROLES: `${API_BASE_URL}/api/${API_VERSION}/settings/roles`,
      PERMISSIONS: `${API_BASE_URL}/api/${API_VERSION}/settings/permissions`,
      TEAMS: `${API_BASE_URL}/api/${API_VERSION}/settings/teams`,
      SSO: `${API_BASE_URL}/api/${API_VERSION}/settings/sso`,
      AUDIT: `${API_BASE_URL}/api/${API_VERSION}/settings/audit`,
    },
  },
}

/**
 * Builds a complete API URL from a path
 * @param path - API path (e.g., 'finops/stats' or '/finops/stats')
 * @returns Complete URL (e.g., buildApiUrl('finops/stats'))
 */
export const buildApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/api/${API_VERSION}/${cleanPath}`
}

/**
 * Wrapper for fetch with automatic API URL building and organization header
 * @param path - API path (e.g., 'finops/stats')
 * @param options - Fetch options
 */
export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  const url = buildApiUrl(path)
  
  const orgUUID = localStorage.getItem('platifyx_current_organization')
  const token = localStorage.getItem('token')
  
  const headers = new Headers(options?.headers)
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  if (orgUUID) {
    headers.set('X-Organization-UUID', orgUUID)
  }
  
  if (!headers.has('Content-Type') && options?.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

export default API_CONFIG
