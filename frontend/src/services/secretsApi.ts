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
  value: string
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
  static async getAWSStats(): Promise<AWSSecretsStats> {
    const response = await fetch(buildApiUrl('awssecrets/stats'), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch AWS Secrets stats')
    }
    return response.json()
  }

  static async listAWSSecrets(): Promise<AWSSecret[]> {
    const response = await fetch(buildApiUrl('awssecrets/list'), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to list AWS Secrets')
    }
    const data = await response.json()
    return data.secrets || []
  }

  static async getAWSSecret(name: string): Promise<AWSSecretValue> {
    const response = await fetch(buildApiUrl(`awssecrets/secret/${encodeURIComponent(name)}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to get AWS Secret')
    }
    return response.json()
  }

  static async describeAWSSecret(name: string): Promise<AWSSecret> {
    const response = await fetch(buildApiUrl(`awssecrets/describe/${encodeURIComponent(name)}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to describe AWS Secret')
    }
    return response.json()
  }

  static async createAWSSecret(name: string, value: string, description?: string): Promise<void> {
    const response = await fetch(buildApiUrl('awssecrets/create'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, secret_value: value, description }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create AWS Secret')
    }
  }

  static async updateAWSSecret(name: string, value: string): Promise<void> {
    const response = await fetch(buildApiUrl(`awssecrets/update/${encodeURIComponent(name)}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ secret_value: value }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update AWS Secret')
    }
  }

  static async deleteAWSSecret(name: string): Promise<void> {
    const response = await fetch(buildApiUrl(`awssecrets/delete/${encodeURIComponent(name)}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete AWS Secret')
    }
  }

  static async getVaultStats(): Promise<VaultStats> {
    const response = await fetch(buildApiUrl('vault/stats'), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch Vault stats')
    }
    return response.json()
  }

  static async getVaultHealth(): Promise<any> {
    const response = await fetch(buildApiUrl('vault/health'), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch Vault health')
    }
    return response.json()
  }

  static async listVaultSecrets(path: string = ''): Promise<VaultSecretListItem[]> {
    const params = new URLSearchParams()
    if (path) params.append('path', path)

    const response = await fetch(buildApiUrl(`vault/kv/list?${params.toString()}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to list Vault secrets')
    }
    const data = await response.json()
    return data.keys || []
  }

  static async readVaultSecret(path: string): Promise<VaultSecret> {
    const params = new URLSearchParams({ path })
    const response = await fetch(buildApiUrl(`vault/kv/read?${params.toString()}`), {
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to read Vault secret')
    }
    return response.json()
  }

  static async writeVaultSecret(path: string, data: Record<string, any>): Promise<void> {
    const response = await fetch(buildApiUrl('vault/kv/write'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, data }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to write Vault secret')
    }
  }

  static async deleteVaultSecret(path: string): Promise<void> {
    const params = new URLSearchParams({ path })
    const response = await fetch(buildApiUrl(`vault/kv/delete?${params.toString()}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete Vault secret')
    }
  }
}
