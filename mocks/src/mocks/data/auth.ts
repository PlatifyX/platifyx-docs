export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'João Silva',
  email: 'joao.silva@example.com',
  role: 'admin'
}

export const mockToken = 'mock-jwt-token-12345'

export const mockLogin = async (email: string, password: string) => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 500))

  // Qualquer email/senha funciona no mock
  return {
    user: mockUser,
    token: mockToken
  }
}

export const mockLogout = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return { success: true }
}

export const mockCheckAuth = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return { user: mockUser }
}
