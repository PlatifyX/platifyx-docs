const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8060'
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  VERSION: API_VERSION,
  ENDPOINTS: {
    INTEGRATIONS: `${API_BASE_URL}/api/${API_VERSION}/integrations`,
    TEMPLATES: `${API_BASE_URL}/api/${API_VERSION}/templates`,
  },
}

export const buildApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/api/${API_VERSION}/${cleanPath}`
}

export default API_CONFIG
