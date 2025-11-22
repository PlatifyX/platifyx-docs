import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertCircle, Server, GitBranch } from 'lucide-react'

function DashboardPage() {

  const metrics: any[] = []
  const services: any[] = []
  const recentDeployments: any[] = []
  const quickStats: any[] = []

  return (
    <div className="max-w-[1400px] mx-auto p-8 min-h-screen">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-[#3e5c76] to-[#3e5c76] rounded-2xl p-10 mb-8 shadow-[0_8px_24px_rgba(62,92,118,0.25)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:right-0 before:w-[400px] before:h-[400px] before:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] before:rounded-full before:translate-x-[30%] before:-translate-y-[30%]">
        <div className="relative z-10 mb-8">
          <h1 className="text-[2.5rem] font-bold m-0 mb-2 text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.15)]">Dashboard</h1>
          <p className="text-base text-white/90 m-0 font-normal">Visão geral da plataforma e serviços</p>
        </div>
        {quickStats.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 relative z-10">
            {quickStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 bg-white/15 backdrop-blur-[10px] border border-white/20 rounded-xl p-5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/20 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 rounded-[10px] flex-shrink-0" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[1.75rem] font-bold text-white leading-[1.2] mb-1">{stat.value}</div>
                  <div className="text-sm text-white/85 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      {metrics.length > 0 ? (
        <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex gap-4 border border-border hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:border-border group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${metric.color}15` }}>
                <div style={{ color: metric.color }}>
                  {metric.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-border font-semibold uppercase tracking-wide">{metric.label}</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold py-1 px-2.5 rounded-md whitespace-nowrap ${metric.trend === 'up' || metric.trend === 'down' ? 'text-emerald-500 bg-emerald-100' : ''}`}>
                    {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {metric.change}
                  </span>
                </div>
                <div className="text-4xl font-bold text-[#0d1321] leading-none">{metric.value}</div>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-[#0d1321] rounded-[10px] border-2 border-dashed border-border min-h-[200px]">
          <Activity size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Nenhuma métrica disponível</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
            Configure as integrações para visualizar métricas da plataforma
          </p>
        </div>
      )}

      <div className="grid grid-cols-[1.5fr_1fr] gap-6 items-start max-[1200px]:grid-cols-1">
        {/* Services Section */}
        <section className="bg-[#1E1E1E] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-border">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white m-0">
              <Server size={20} />
              Serviços em Produção
            </h2>
            {services.length > 0 && (
              <span className="inline-flex items-center py-1.5 px-3.5 bg-gradient-to-br from-[#3e5c76] to-[#3e5c76] text-white rounded-[20px] text-sm font-semibold shadow-[0_2px_8px_rgba(62,92,118,0.3)]">{services.length} ativos</span>
            )}
          </div>
          {services.length > 0 ? (
            <div className="flex flex-col gap-4">
              {services.map((service) => (
                <div key={service.name} className="bg-[#0d1321] border border-border rounded-[10px] p-4 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white hover:border-border hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center justify-center flex-shrink-0">
                      {service.status === 'healthy' ? (
                        <CheckCircle className="text-emerald-500" size={20} />
                      ) : service.status === 'warning' ? (
                        <AlertCircle className="text-amber-500" size={20} />
                      ) : (
                        <Activity className="text-red-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-white mb-1 font-['Monaco','Menlo','Ubuntu_Mono',monospace]">{service.name}</div>
                      <div className="flex items-center gap-2 text-sm text-border">
                        <span className="font-semibold text-[#3e5c76] font-['Monaco','Menlo','Ubuntu_Mono',monospace]">{service.version}</span>
                        <span className="text-border">•</span>
                        <span className="text-border">{service.deployedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 pl-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-border font-medium uppercase tracking-wider">Requests</span>
                      <span className="text-sm font-bold text-white">{service.requests}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-border font-medium uppercase tracking-wider">Uptime</span>
                      <span className="text-sm font-bold text-white">{service.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-[#0d1321] rounded-[10px] border-2 border-dashed border-border min-h-[200px]">
              <Server size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                Nenhum serviço encontrado. Configure o Kubernetes para visualizar serviços.
              </p>
            </div>
          )}
        </section>

        {/* Recent Deployments */}
        <section className="bg-[#1E1E1E] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-border">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white m-0">
              <GitBranch size={20} />
              Deployments
            </h2>
          </div>
          {recentDeployments.length > 0 ? (
            <div className="flex flex-col gap-0">
              {recentDeployments.map((deploy, idx) => (
                <div key={idx} className="flex gap-4 py-5 border-b border-border transition-all duration-200 last:border-b-0 hover:bg-[#0d1321] hover:-mx-4 hover:px-4 hover:rounded-lg">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-1">
                    <div className={`w-3 h-3 rounded-full border-2 border-current flex-shrink-0 ${deploy.status === 'success' ? 'text-emerald-500 bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]' : deploy.status === 'warning' ? 'text-amber-500 bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]' : 'shadow-[0_0_0_4px_rgba(62,92,118,0.1)]'}`}></div>
                    {idx < recentDeployments.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-transparent min-h-[24px]"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                      <span className="text-[0.9375rem] font-bold text-white font-['Monaco','Menlo','Ubuntu_Mono',monospace]">{deploy.service}</span>
                      <span className="text-[0.8125rem] font-semibold text-white font-['Monaco','Menlo','Ubuntu_Mono',monospace] bg-[#0d1321] py-0.5 px-2 rounded">{deploy.version}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8125rem] text-border">
                      <span className="font-medium">{deploy.author}</span>
                      <span className="text-border">•</span>
                      <span className="text-border">{deploy.time}</span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${deploy.status === 'success' ? 'text-emerald-500 bg-emerald-100' : deploy.status === 'warning' ? 'text-amber-500 bg-amber-50' : ''}`}>
                    {deploy.status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-[#0d1321] rounded-[10px] border-2 border-dashed border-border min-h-[200px]">
              <GitBranch size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                Nenhum deployment recente. Configure Azure DevOps para visualizar deployments.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
