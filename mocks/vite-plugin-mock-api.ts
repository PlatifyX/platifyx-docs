import type { Plugin } from 'vite'
import { mockQualityStats, mockProjects, mockProjectDetails, mockIssues } from './src/mocks/data/quality'
import { getMockMaturityScorecard } from './src/mocks/data/maturity'
import { 
  mockAWSSecrets, 
  mockAWSSecretsStats, 
  mockAWSSecretValues,
  mockVaultSecrets,
  mockVaultStats,
  mockVaultSecretData
} from './src/mocks/data/secrets'

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/api/v1/quality/stats', (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-UUID')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        const stats = {
          totalProjects: mockQualityStats.totalProjects,
          totalBugs: mockQualityStats.totalBugs,
          totalVulnerabilities: mockQualityStats.totalVulnerabilities,
          totalCodeSmells: mockQualityStats.totalCodeSmells,
          avgCoverage: mockQualityStats.averageCoverage,
          passedQualityGates: mockQualityStats.qualityGatePassed,
          failedQualityGates: mockQualityStats.qualityGateFailed,
          qualityGatePassRate: (mockQualityStats.qualityGatePassed / (mockQualityStats.qualityGatePassed + mockQualityStats.qualityGateFailed)) * 100,
          avgDuplications: 4.57,
          totalSecurityHotspots: 12,
          totalLines: 36200
        }

        setTimeout(() => {
          res.writeHead(200)
          res.end(JSON.stringify(stats))
        }, 200)
      })

      server.middlewares.use('/api/v1/quality/projects', (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-UUID')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        setTimeout(() => {
          res.writeHead(200)
          res.end(JSON.stringify({ projects: mockProjects }))
        }, 200)
      })

      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/v1/quality/projects/') && req.method === 'GET') {
          const projectKey = req.url.split('/').pop()?.split('?')[0]
          
          if (projectKey && mockProjectDetails[projectKey]) {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify(mockProjectDetails[projectKey]))
            }, 200)
            return
          }
        }
        
        if (req.url?.startsWith('/api/v1/quality/issues')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-UUID')

          if (req.method === 'OPTIONS') {
            res.writeHead(200)
            res.end()
            return
          }

          if (req.method === 'GET') {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ issues: mockIssues }))
            }, 200)
            return
          }
        }

        if (req.url?.startsWith('/api/v1/maturity/team/') && req.method === 'GET') {
          const urlParts = req.url.split('/')
          const teamNameIndex = urlParts.indexOf('team')
          if (teamNameIndex !== -1 && urlParts[teamNameIndex + 1]) {
            const teamName = decodeURIComponent(urlParts[teamNameIndex + 1].split('?')[0])
            
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-UUID')

            if (req.method === 'OPTIONS') {
              res.writeHead(200)
              res.end()
              return
            }

            setTimeout(async () => {
              try {
                const scorecard = await getMockMaturityScorecard(teamName)
                res.writeHead(200)
                res.end(JSON.stringify(scorecard))
              } catch (error) {
                res.writeHead(500)
                res.end(JSON.stringify({ error: 'Failed to fetch maturity scorecard' }))
              }
            }, 300)
            return
          }
        }

        if (req.url?.startsWith('/api/v1/awssecrets/')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-UUID')

          if (req.method === 'OPTIONS') {
            res.writeHead(200)
            res.end()
            return
          }

          const url = new URL(req.url, 'http://localhost')
          const integrationId = url.searchParams.get('integration_id')

          if (req.url.includes('/stats')) {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify(mockAWSSecretsStats))
            }, 200)
            return
          }

          if (req.url.includes('/list')) {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ secrets: mockAWSSecrets }))
            }, 300)
            return
          }

          if (req.url.includes('/secret/') && req.method === 'GET') {
            const secretName = decodeURIComponent(req.url.split('/secret/')[1].split('?')[0])
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({
                name: secretName,
                secretString: mockAWSSecretValues[secretName] || '{}',
                versionId: 'v1'
              }))
            }, 250)
            return
          }

          if (req.url.includes('/describe/') && req.method === 'GET') {
            const secretName = decodeURIComponent(req.url.split('/describe/')[1].split('?')[0])
            const secret = mockAWSSecrets.find(s => s.name === secretName)
            setTimeout(() => {
              if (secret) {
                res.writeHead(200)
                res.end(JSON.stringify(secret))
              } else {
                res.writeHead(404)
                res.end(JSON.stringify({ error: 'Secret not found' }))
              }
            }, 200)
            return
          }

          if (req.url.includes('/create') && req.method === 'POST') {
            setTimeout(() => {
              res.writeHead(201)
              res.end(JSON.stringify({ message: 'Secret created successfully' }))
            }, 300)
            return
          }

          if (req.url.includes('/update/') && req.method === 'PUT') {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ message: 'Secret updated successfully' }))
            }, 300)
            return
          }

          if (req.url.includes('/delete/') && req.method === 'DELETE') {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ message: 'Secret deleted successfully' }))
            }, 300)
            return
          }
        }

        if (req.url?.startsWith('/api/v1/vault/')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization-UUID')

          if (req.method === 'OPTIONS') {
            res.writeHead(200)
            res.end()
            return
          }

          const url = new URL(req.url, 'http://localhost')
          const integrationId = url.searchParams.get('integration_id')
          const path = url.searchParams.get('path') || ''
          const mount = url.searchParams.get('mount') || 'secret'

          if (req.url.includes('/stats')) {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify(mockVaultStats))
            }, 200)
            return
          }

          if (req.url.includes('/health')) {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ initialized: true, sealed: false }))
            }, 200)
            return
          }

          if (req.url.includes('/kv/list')) {
            setTimeout(() => {
              let filteredSecrets = mockVaultSecrets
              if (path) {
                const pathParts = path.split('/').filter(p => p)
                filteredSecrets = mockVaultSecrets.filter(s => {
                  const secretParts = s.path.split('/').filter(p => p)
                  if (secretParts.length <= pathParts.length) return false
                  return secretParts.slice(0, pathParts.length).join('/') === pathParts.join('/')
                }).map(s => ({
                  ...s,
                  path: s.path.split('/').slice(pathParts.length).join('/')
                }))
              } else {
                filteredSecrets = mockVaultSecrets.filter(s => !s.path.includes('/'))
              }
              
              const keys = filteredSecrets.map(s => s.isFolder ? `${s.path}/` : s.path)
              res.writeHead(200)
              res.end(JSON.stringify({ keys }))
            }, 300)
            return
          }

          if (req.url.includes('/kv/read') && req.method === 'GET') {
            const fullPath = path.startsWith('secret/') || path.startsWith('kv/') ? path : `secret/${path}`
            const secret = mockVaultSecretData[fullPath]
            setTimeout(() => {
              if (secret) {
                res.writeHead(200)
                res.end(JSON.stringify(secret))
              } else {
                res.writeHead(404)
                res.end(JSON.stringify({ error: 'Secret not found' }))
              }
            }, 250)
            return
          }

          if (req.url.includes('/kv/write') && req.method === 'POST') {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ message: 'Secret written successfully' }))
            }, 300)
            return
          }

          if (req.url.includes('/kv/delete') && req.method === 'DELETE') {
            setTimeout(() => {
              res.writeHead(200)
              res.end(JSON.stringify({ message: 'Secret deleted successfully' }))
            }, 300)
            return
          }
        }

        next()
      })
    }
  }
}

