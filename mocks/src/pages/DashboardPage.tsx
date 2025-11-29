import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertCircle, Server, GitBranch, Zap, Clock, Shield, Rocket, Container, Package, AlertTriangle } from 'lucide-react'
import { getMockDashboardData } from '../mocks/data/dashboard'

function DashboardPage() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [recentDeployments, setRecentDeployments] = useState<any[]>([])
  const [quickStats, setQuickStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await getMockDashboardData()
        setMetrics(data.metrics)
        setServices(data.services)
        setRecentDeployments(data.recentDeployments)
        setQuickStats(data.quickStats)
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <p className="mt-6 text-lg text-text-secondary font-medium">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const getMetricIcon = (iconName: string) => {
    switch (iconName) {
      case 'check':
        return <CheckCircle className="w-6 h-6" />
      case 'zap':
        return <Zap className="w-6 h-6" />
      case 'clock':
        return <Clock className="w-6 h-6" />
      case 'alert':
        return <AlertTriangle className="w-6 h-6" />
      default:
        return <Activity className="w-6 h-6" />
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 min-h-screen bg-background">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text mb-2">Dashboard</h1>
        <p className="text-lg text-text-secondary">Visão geral da plataforma e serviços</p>
      </div>

      {quickStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => {
            const getIcon = () => {
              switch (stat.icon) {
                case 'rocket':
                  return <Rocket className="w-8 h-8" style={{ color: stat.color }} />
                case 'container':
                  return <Container className="w-8 h-8" style={{ color: stat.color }} />
                case 'package':
                  return <Package className="w-8 h-8" style={{ color: stat.color }} />
                case 'alert':
                  return <AlertTriangle className="w-8 h-8" style={{ color: stat.color }} />
                default:
                  return <Activity className="w-8 h-8" style={{ color: stat.color }} />
              }
            }
            return (
              <div key={stat.label} className="bg-gradient-to-br from-surface to-surface/80 border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  {getIcon()}
                  <div className={`w-3 h-3 rounded-full ${stat.color === '#10b981' ? 'bg-success' : stat.color === '#3b82f6' ? 'bg-primary' : stat.color === '#8b5cf6' ? 'bg-purple-500' : 'bg-warning'}`}></div>
                </div>
                <div className="text-3xl font-bold text-text mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-text-secondary">{stat.label}</div>
              </div>
            )
          })}
        </div>
      )}

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-surface rounded-2xl p-6 shadow-lg border border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`} style={{ backgroundColor: `${metric.color}15`, color: metric.color }}>
                  {getMetricIcon(metric.icon)}
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-full ${metric.trend === 'up' ? 'text-emerald-400 bg-emerald-500/20' : 'text-red-400 bg-red-500/20'}`}>
                  {metric.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {metric.change}
                </span>
              </div>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{metric.label}</div>
              <div className="text-4xl font-bold text-text leading-none mb-1">{metric.value}</div>
              <div className="h-2 bg-background rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: metric.trend === 'up' ? '85%' : '60%',
                    backgroundColor: metric.color 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text m-0">Serviços em Produção</h2>
                  <p className="text-sm text-text-secondary m-0 mt-1">{services.length} serviços ativos</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold text-sm">
                {services.length} ativos
              </div>
            </div>
            {services.length > 0 ? (
              <div className="space-y-3">
                {services.slice(0, 6).map((service) => (
                  <div key={service.name} className="bg-background border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {service.status === 'healthy' ? (
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <CheckCircle className="text-emerald-600" size={20} />
                            </div>
                          ) : service.status === 'warning' ? (
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <AlertCircle className="text-amber-600" size={20} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <Activity className="text-red-600" size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-text font-mono">{service.name}</h3>
                            <span className="px-2 py-1 bg-surface text-text-secondary rounded text-xs font-semibold font-mono">{service.version}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Zap size={14} />
                              {service.requests}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity size={14} />
                              {service.uptime}
                            </span>
                            <span className="text-text-secondary/70">{service.deployedAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Server size={64} className="text-text-secondary/30 mb-4" />
                <p className="text-text-secondary">Nenhum serviço encontrado</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text m-0">Deployments Recentes</h2>
                <p className="text-sm text-text-secondary m-0 mt-1">Últimas atualizações</p>
              </div>
            </div>
            {recentDeployments.length > 0 ? (
              <div className="space-y-0">
                {recentDeployments.slice(0, 8).map((deploy, idx) => (
                  <div key={idx} className="flex items-start gap-4 py-4 border-b border-border last:border-b-0 hover:bg-background/50 transition-colors rounded-lg px-2 -mx-2 group">
                    <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-1">
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${deploy.status === 'success' ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'bg-amber-500 border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.1)]'}`}></div>
                      {idx < Math.min(recentDeployments.length, 8) - 1 && <div className="w-0.5 h-8 bg-border"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-bold text-text font-mono">{deploy.service}</span>
                        <span className="px-2 py-0.5 bg-background text-text-secondary rounded text-xs font-semibold font-mono">{deploy.version}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span>{deploy.author}</span>
                        <span>•</span>
                        <span>{deploy.time}</span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all group-hover:scale-110 ${deploy.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {deploy.status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GitBranch size={64} className="text-text-secondary/30 mb-4" />
                <p className="text-text-secondary">Nenhum deployment recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
