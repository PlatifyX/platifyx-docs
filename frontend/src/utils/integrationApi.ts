import { API_CONFIG } from '../config/api'

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
  private static baseUrl = API_CONFIG.ENDPOINTS.INTEGRATIONS

  static async getAll(): Promise<Integration[]> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) throw new Error('Failed to fetch integrations')
    const data: IntegrationsResponse = await response.json()
    return data.integrations || []
  }

  static async create(type: string, name: string, config: any): Promise<void> {
    const response = await fetch(this.baseUrl, {
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

    if (!response.ok) throw new Error('Failed to create integration')
  }

  static async update(id: number, data: { name?: string; enabled?: boolean; config?: any }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to update integration')
  }

  static async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete integration')
  }

  static async toggle(integration: Integration): Promise<void> {
    await this.update(integration.id, {
      enabled: !integration.enabled,
      config: integration.config || {},
    })
  }
}
