import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'

function HomePage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <section className="text-center py-15 px-5">
        <h1 className="text-5xl font-bold mb-4 text-text">
          Bem-vindo ao <span className="text-primary">PlatifyX</span>
        </h1>
        <p className="text-2xl text-text-secondary mb-4 font-medium">
          Developer Portal & Platform Engineering Hub
        </p>
        <p className="text-base text-text-secondary max-w-[700px] mx-auto leading-relaxed">
          Centralize DevOps, Kubernetes, Observabilidade, Qualidade e Governança em um único lugar.
          Self-service, padronização e autonomia para times de engenharia.
        </p>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 my-15">
        <div className="bg-surface border border-border rounded-xl p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white mb-5">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-text">Self-Service</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Crie serviços, pipelines e infraestrutura com templates padronizados em minutos
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white mb-5">
            <Shield size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-text">Governança</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Segurança, compliance e políticas automatizadas desde o início
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white mb-5">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-text">Observabilidade</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Logs, métricas e traces centralizados com Grafana Stack completo
          </p>
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-[28px] font-semibold mb-6 text-text">Ações Rápidas</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="bg-gradient-to-br from-primary to-secondary text-white border-none py-3.5 px-7 rounded-lg text-[15px] font-semibold flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] cursor-pointer">
            Criar Novo Serviço
            <ArrowRight size={18} />
          </button>
          <button className="bg-gradient-to-br from-primary to-secondary text-white border-none py-3.5 px-7 rounded-lg text-[15px] font-semibold flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] cursor-pointer">
            Ver Catálogo
            <ArrowRight size={18} />
          </button>
          <button className="bg-gradient-to-br from-primary to-secondary text-white border-none py-3.5 px-7 rounded-lg text-[15px] font-semibold flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] cursor-pointer">
            Explorar Templates
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage
