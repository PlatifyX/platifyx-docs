export const mockOrganizations = [
  {
    uuid: '550e8400-e29b-41d4-a716-446655440001',
    name: 'PlatifyX',
    ssoActive: false,
    databaseAddressWrite: 'postgres://demo-db:5432/platifyx',
    databaseAddressRead: 'postgres://demo-db:5432/platifyx',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-16T14:30:00Z'
  }
]

export const getMockOrganizations = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockOrganizations
}

export const getMockOrganizationByUUID = async (uuid: string) => {
  await new Promise(resolve => setTimeout(resolve, 150))
  return mockOrganizations.find(org => org.uuid === uuid) || mockOrganizations[0]
}

export const mockCreateOrganization = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  const newOrg = {
    uuid: 'new-org-' + Math.random().toString(36).substr(2, 9),
    name: data.name,
    ssoActive: data.ssoActive || false,
    databaseAddressWrite: data.databaseAddressWrite,
    databaseAddressRead: data.databaseAddressRead || data.databaseAddressWrite,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  return newOrg
}
