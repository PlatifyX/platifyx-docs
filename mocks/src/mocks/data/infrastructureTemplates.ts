export interface Template {
  type: string
  name: string
  description: string
  languages: string[]
  icon: string
}

export const mockTemplates: Template[] = [
  {
    type: 'api',
    name: 'API REST',
    description: 'Template para criar uma API REST com endpoints padronizados, autenticação e documentação Swagger',
    languages: ['TypeScript', 'Go', 'Python', 'Java', 'Node.js'],
    icon: '🌐'
  },
  {
    type: 'frontend',
    name: 'Frontend Application',
    description: 'Template para aplicações frontend React com TypeScript, roteamento e gerenciamento de estado',
    languages: ['TypeScript', 'JavaScript'],
    icon: '💻'
  },
  {
    type: 'worker',
    name: 'Background Worker',
    description: 'Template para workers que processam tarefas em background de forma assíncrona',
    languages: ['TypeScript', 'Go', 'Python', 'Java', 'Node.js'],
    icon: '⚙️'
  },
  {
    type: 'cronjob',
    name: 'Cron Job',
    description: 'Template para jobs agendados que executam tarefas periódicas no Kubernetes',
    languages: ['TypeScript', 'Go', 'Python', 'Bash'],
    icon: '⏰'
  },
  {
    type: 'statefulset',
    name: 'StatefulSet',
    description: 'Template para aplicações que requerem armazenamento persistente e identidade estável',
    languages: ['TypeScript', 'Go', 'Python', 'Java'],
    icon: '💾'
  },
  {
    type: 'database',
    name: 'Database Service',
    description: 'Template para serviços de banco de dados com configurações de alta disponibilidade',
    languages: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB'],
    icon: '🗄️'
  },
  {
    type: 'messaging',
    name: 'Messaging Queue',
    description: 'Template para serviços de mensageria usando RabbitMQ, Kafka ou Redis',
    languages: ['TypeScript', 'Go', 'Python', 'Java'],
    icon: '📨'
  },
  {
    type: 'deployment',
    name: 'Deployment',
    description: 'Template básico para deployments Kubernetes com configurações padrão',
    languages: ['YAML', 'Helm'],
    icon: '📦'
  }
]

export const getMockInfrastructureTemplates = async (): Promise<{ templates: Template[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return { templates: mockTemplates }
}

