import { AWSSecret, AWSSecretsStats, VaultSecretListItem, VaultStats, VaultSecret } from '../../services/secretsApi'

export const mockAWSSecrets: AWSSecret[] = [
  {
    name: 'prod/database/password',
    arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/database/password-abc123',
    description: 'Senha do banco de dados de produção',
    createdDate: '2024-01-15T10:00:00Z',
    lastChangedDate: '2024-03-10T14:30:00Z',
    lastAccessedDate: '2024-03-16T08:00:00Z',
    versionId: 'v1'
  },
  {
    name: 'prod/api/keys',
    arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api/keys-def456',
    description: 'Chaves de API para serviços externos',
    createdDate: '2024-02-01T09:00:00Z',
    lastChangedDate: '2024-03-12T11:20:00Z',
    lastAccessedDate: '2024-03-16T10:15:00Z',
    versionId: 'v2'
  },
  {
    name: 'staging/oauth/client-secret',
    arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:staging/oauth/client-secret-ghi789',
    description: 'Client secret OAuth para ambiente de staging',
    createdDate: '2024-02-15T14:00:00Z',
    lastChangedDate: '2024-03-05T16:45:00Z',
    lastAccessedDate: '2024-03-15T13:30:00Z',
    versionId: 'v1'
  }
]

export const mockAWSSecretsStats: AWSSecretsStats = {
  total_secrets: 3,
  recently_accessed: 2,
  pending_deletion: 0
}

export const mockAWSSecretValues: Record<string, string> = {
  'prod/database/password': JSON.stringify({
    username: 'admin',
    password: 'secure_password_123',
    host: 'db.prod.example.com',
    port: '5432'
  }),
  'prod/api/keys': JSON.stringify({
    stripe_key: 'sk_live_abc123',
    paypal_client_id: 'paypal_client_xyz789'
  }),
  'staging/oauth/client-secret': JSON.stringify({
    client_id: 'oauth_client_staging',
    client_secret: 'staging_secret_key'
  })
}

export const mockVaultSecrets: VaultSecretListItem[] = [
  {
    path: 'secret',
    isFolder: true
  },
  {
    path: 'kv',
    isFolder: true
  },
  {
    path: 'secret/api-keys',
    isFolder: false
  },
  {
    path: 'secret/database',
    isFolder: false
  },
  {
    path: 'kv/production',
    isFolder: true
  },
  {
    path: 'kv/staging',
    isFolder: true
  }
]

export const mockVaultSecretData: Record<string, VaultSecret> = {
  'secret/api-keys': {
    path: 'secret/api-keys',
    data: {
      stripe_key: 'sk_live_abc123',
      paypal_key: 'paypal_key_xyz789',
      github_token: 'ghp_token_123456'
    },
    metadata: {
      created_time: '2024-01-15T10:00:00Z',
      deletion_time: '',
      destroyed: false,
      version: 3
    }
  },
  'secret/database': {
    path: 'secret/database',
    data: {
      username: 'admin',
      password: 'secure_password',
      host: 'db.example.com'
    },
    metadata: {
      created_time: '2024-02-01T09:00:00Z',
      deletion_time: '',
      destroyed: false,
      version: 1
    }
  },
  'kv/production': {
    path: 'kv/production',
    data: {},
    metadata: {
      created_time: '2024-01-10T08:00:00Z',
      deletion_time: '',
      destroyed: false,
      version: 1
    }
  },
  'kv/staging': {
    path: 'kv/staging',
    data: {},
    metadata: {
      created_time: '2024-01-10T08:00:00Z',
      deletion_time: '',
      destroyed: false,
      version: 1
    }
  }
}

export const mockVaultStats: VaultStats = {
  initialized: true,
  sealed: false,
  total_secrets: 4
}

export const getMockAWSSecrets = async (integrationId: number): Promise<AWSSecret[]> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockAWSSecrets
}

export const getMockAWSSecretsStats = async (integrationId: number): Promise<AWSSecretsStats> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockAWSSecretsStats
}

export const getMockAWSSecretValue = async (integrationId: number, name: string): Promise<{ name: string; secretString: string; versionId?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return {
    name,
    secretString: mockAWSSecretValues[name] || '{}',
    versionId: 'v1'
  }
}

export const getMockVaultSecrets = async (integrationId: number, path: string = ''): Promise<VaultSecretListItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  if (!path) {
    return mockVaultSecrets.filter(s => !s.path.includes('/'))
  }
  
  const pathParts = path.split('/').filter(p => p)
  return mockVaultSecrets.filter(s => {
    const secretParts = s.path.split('/').filter(p => p)
    if (secretParts.length <= pathParts.length) return false
    return secretParts.slice(0, pathParts.length).join('/') === pathParts.join('/')
  }).map(s => ({
    ...s,
    path: s.path.split('/').slice(pathParts.length).join('/')
  }))
}

export const getMockVaultStats = async (integrationId: number): Promise<VaultStats> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockVaultStats
}

export const getMockVaultSecret = async (integrationId: number, path: string): Promise<VaultSecret> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  const fullPath = path.startsWith('secret/') || path.startsWith('kv/') ? path : `secret/${path}`
  return mockVaultSecretData[fullPath] || {
    path: fullPath,
    data: {},
    metadata: {
      created_time: new Date().toISOString(),
      deletion_time: '',
      destroyed: false,
      version: 1
    }
  }
}

