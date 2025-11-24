import { buildApiUrl } from '../config/api'

export interface Organization {
  uuid: string
  name: string
  ssoActive: boolean
  databaseAddressWrite: string
  databaseAddressRead: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationsResponse {
  organizations: Organization[]
  total: number
}

export interface CreateOrganizationRequest {
  name: string
  ssoActive: boolean
  databaseAddressWrite: string
  databaseAddressRead?: string
}

export interface UpdateOrganizationRequest {
  name?: string
  ssoActive?: boolean
  databaseAddressWrite?: string
  databaseAddressRead?: string
}

export class OrganizationApi {
  private static baseUrl = buildApiUrl('organizations')

  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    const orgUUID = localStorage.getItem('platifyx_current_organization')
    if (orgUUID) {
      headers['X-Organization-UUID'] = orgUUID
    }
    
    return headers
  }

  static async getAll(): Promise<Organization[]> {
    const response = await fetch(this.baseUrl, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch organizations')
    }
    const data: OrganizationsResponse = await response.json()
    return data.organizations || []
  }

  static async getByUUID(uuid: string): Promise<Organization> {
    const response = await fetch(`${this.baseUrl}/${uuid}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch organization')
    }
    return response.json()
  }

  static async create(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Failed to create organization')
    }

    return response.json()
  }

  static async update(uuid: string, data: UpdateOrganizationRequest): Promise<Organization> {
    const response = await fetch(`${this.baseUrl}/${uuid}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Failed to update organization')
    }

    return response.json()
  }

  static async delete(uuid: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${uuid}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Failed to delete organization')
    }
  }

  static async getOrganizationUsers(uuid: string): Promise<UserOrganization[]> {
    const response = await fetch(`${this.baseUrl}/${uuid}/users`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch organization users')
    }
    const data: { users: UserOrganization[]; total: number } = await response.json()
    return data.users || []
  }

  static async addUserToOrganization(uuid: string, userId: string, role?: string): Promise<UserOrganization> {
    const response = await fetch(`${this.baseUrl}/${uuid}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, role: role || 'member' }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Failed to add user to organization')
    }

    return response.json()
  }

  static async updateUserRole(uuid: string, userId: string, role: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${uuid}/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Failed to update user role')
    }
  }

  static async removeUserFromOrganization(uuid: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${uuid}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || error.error || 'Failed to remove user from organization')
    }
  }
}

export interface UserOrganization {
  id: string
  userId: string
  organizationUuid: string
  role: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    name: string
    avatar_url?: string
  }
  organization?: Organization
}

