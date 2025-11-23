import { buildApiUrl } from '../config/api'

export interface AWSSecret {
  name: string
  arn?: string
  description?: string
  createdDate?: string
  lastChangedDate?: string
  lastAccessedDate?: string
  versionId?: string
}

export interface AWSSecretValue {
  name: string
  secretString: string
  versionId?: string
}

export interface VaultSecret {
  path: string
  data: Record<string, any>
  metadata?: {
    created_time: string
    deletion_time: string
    destroyed: boolean
    version: number
  }
}

export interface VaultSecretListItem {
  path: string
  isFolder: boolean
}

export interface AWSSecretsStats {
  total_secrets: number
  recently_accessed: number
  pending_deletion: number
}

export interface VaultStats {
  initialized: boolean
  sealed: boolean
  total_secrets?: number
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

export class SecretsApi {
  static async getAWSStats(integrationId: number): Promise<AWSSecretsStats> {
    const response = await fetch(buildApiUrl(`awssecrets/stats?integration_id=${integrationId}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch AWS Secrets stats' }))
      throw new Error(error.error || 'Failed to fetch AWS Secrets stats')
    }
    return response.json()
  }

  static async listAWSSecrets(integrationId: number): Promise<AWSSecret[]> {
    const response = await fetch(buildApiUrl(`awssecrets/list?integration_id=${integrationId}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to list AWS Secrets' }))
      throw new Error(error.error || 'Failed to list AWS Secrets')
    }
    const data = await response.json()
    return data.secrets || []
  }

  static async getAWSSecret(integrationId: number, name: string): Promise<AWSSecretValue> {
    const response = await fetch(buildApiUrl(`awssecrets/secret/${encodeURIComponent(name)}?integration_id=${integrationId}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get AWS Secret' }))
      throw new Error(error.error || 'Failed to get AWS Secret')
    }
    return response.json()
  }

  static async describeAWSSecret(integrationId: number, name: string): Promise<AWSSecret> {
    const response = await fetch(buildApiUrl(`awssecrets/describe/${encodeURIComponent(name)}?integration_id=${integrationId}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to describe AWS Secret' }))
      throw new Error(error.error || 'Failed to describe AWS Secret')
    }
    return response.json()
  }

  static async createAWSSecret(integrationId: number, name: string, value: string, description?: string): Promise<void> {
    const response = await fetch(buildApiUrl(`awssecrets/create?integration_id=${integrationId}`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, secret_value: value, description }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create AWS Secret' }))
      throw new Error(error.error || 'Failed to create AWS Secret')
    }
  }

  static async updateAWSSecret(integrationId: number, name: string, value: string): Promise<void> {
    const response = await fetch(buildApiUrl(`awssecrets/update/${encodeURIComponent(name)}?integration_id=${integrationId}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ secret_value: value }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update AWS Secret' }))
      throw new Error(error.error || 'Failed to update AWS Secret')
    }
  }

  static async deleteAWSSecret(integrationId: number, name: string): Promise<void> {
    const response = await fetch(buildApiUrl(`awssecrets/delete/${encodeURIComponent(name)}?integration_id=${integrationId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete AWS Secret' }))
      throw new Error(error.error || 'Failed to delete AWS Secret')
    }
  }

  static async getVaultStats(integrationId: number): Promise<VaultStats> {
    const response = await fetch(buildApiUrl(`vault/stats?integration_id=${integrationId}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch Vault stats' }))
      throw new Error(error.error || 'Failed to fetch Vault stats')
    }
    return response.json()
  }

  static async getVaultHealth(integrationId: number): Promise<any> {
    const response = await fetch(buildApiUrl(`vault/health?integration_id=${integrationId}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch Vault health' }))
      throw new Error(error.error || 'Failed to fetch Vault health')
    }
    return response.json()
  }

  static async listVaultSecrets(integrationId: number, path: string = '', mount: string = 'secret'): Promise<VaultSecretListItem[]> {
    const params = new URLSearchParams({
      integration_id: integrationId.toString(),
      mount,
    })
    if (path) params.append('path', path)

    const response = await fetch(buildApiUrl(`vault/kv/list?${params.toString()}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to list Vault secrets' }))
      throw new Error(error.error || 'Failed to list Vault secrets')
    }
    const data = await response.json()
    return data.keys || []
  }

  static async readVaultSecret(integrationId: number, path: string, mount: string = 'secret'): Promise<VaultSecret> {
    const params = new URLSearchParams({
      integration_id: integrationId.toString(),
      mount,
      path,
    })
    const response = await fetch(buildApiUrl(`vault/kv/read?${params.toString()}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to read Vault secret' }))
      throw new Error(error.error || 'Failed to read Vault secret')
    }
    return response.json()
  }

  static async writeVaultSecret(integrationId: number, path: string, data: Record<string, any>): Promise<void> {
    const response = await fetch(buildApiUrl(`vault/kv/write?integration_id=${integrationId}`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, data }),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to write Vault secret' }))
      throw new Error(error.error || 'Failed to write Vault secret')
    }
  }

  static async deleteVaultSecret(integrationId: number, path: string, mount: string = 'secret'): Promise<void> {
    const params = new URLSearchParams({
      integration_id: integrationId.toString(),
      mount,
      path,
    })
    const response = await fetch(buildApiUrl(`vault/kv/delete?${params.toString()}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete Vault secret' }))
      throw new Error(error.error || 'Failed to delete Vault secret')
    }
  }
}
