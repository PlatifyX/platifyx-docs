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
 * Wrapper for fetch with automatic API URL building
 * @param path - API path (e.g., 'finops/stats')
 * @param options - Fetch options
 */
export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  const url = buildApiUrl(path)
  return fetch(url, options)
}

export default API_CONFIG
