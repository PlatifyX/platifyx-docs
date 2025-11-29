import { apiFetch } from '../config/api'

export interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

export interface IntegrationsResponse {
  integrations: Integration[]
}

export class IntegrationApi {
  private static basePath = 'integrations'

  static async getAll(): Promise<Integration[]> {
    const response = await apiFetch(this.basePath)
    if (!response.ok) throw new Error('Failed to fetch integrations')
    const data: IntegrationsResponse = await response.json()
    return data.integrations || []
  }

  static async create(type: string, name: string, config: any): Promise<void> {
    const response = await apiFetch(this.basePath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        name,
        enabled: true,
        config,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create integration' }))
      throw new Error(error.error || 'Failed to create integration')
    }
  }

  static async update(id: number, data: { name?: string; enabled?: boolean; config?: any }): Promise<void> {
    const response = await apiFetch(`${this.basePath}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update integration' }))
      throw new Error(error.error || 'Failed to update integration')
    }
  }

  static async delete(id: number): Promise<void> {
    const response = await apiFetch(`${this.basePath}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete integration' }))
      throw new Error(error.error || 'Failed to delete integration')
    }
  }

  static async toggle(integration: Integration): Promise<void> {
    await this.update(integration.id, {
      enabled: !integration.enabled,
      config: integration.config || {},
    })
  }

  static async requestIntegration(data: {
    name: string
    description: string
    useCase: string
    website?: string
    apiDocumentation?: string
    priority: 'low' | 'medium' | 'high'
  }): Promise<void> {
    const response = await apiFetch(`${this.basePath}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to submit integration request' }))
      throw new Error(error.error || 'Failed to submit integration request')
    }
  }
}
