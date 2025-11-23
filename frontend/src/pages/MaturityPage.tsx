import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Target,
  Shield,
  DollarSign,
  FileText,
  Activity
} from 'lucide-react'
import { buildApiUrl } from '../config/api'

interface MaturityScore {
  category: string
  score: number
  maxScore: number
  level: string
  metrics: any[]
  recommendations: Recommendation[]
  lastUpdated: string
}

interface Recommendation {
  id: string
  type: string
  severity: string
  title: string
  description: string
  reason: string
  action: string
  impact: string
  confidence: number
}

interface TeamScorecard {
  teamId: string
  teamName: string
  scores: MaturityScore[]
  overallScore: number
  rank?: number
  lastUpdated: string
  trend: string
}

const categoryIcons: Record<string, any> = {
  observability: Activity,
  automated_tests: CheckCircle,
  incident_response: AlertCircle,
  finops: DollarSign,
  security: Shield,
  documentation: FileText
}

const categoryLabels: Record<string, string> = {
  observability: 'Observabilidade',
  automated_tests: 'Testes Automatizados',
  incident_response: 'Resposta a Incidentes',
  finops: 'FinOps',
  security: 'Segurança',
  documentation: 'Documentação'
}

const levelColors: Record<string, string> = {
  expert: 'text-green-400',
  advanced: 'text-blue-400',
  intermediate: 'text-yellow-400',
  beginner: 'text-red-400'
}

function MaturityPage() {
  const [teamName, setTeamName] = useState('')
  const [scorecard, setScorecard] = useState<TeamScorecard | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchScorecard = async () => {
    if (!teamName.trim()) return

    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(`maturity/team/${teamName}/scorecard`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setScorecard(data)
      } else {
        alert('Time não encontrado ou erro ao buscar scorecard')
      }
    } catch (error) {
      console.error('Failed to fetch scorecard:', error)
      alert('Erro ao buscar scorecard')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-blue-400'
    if (score >= 4) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-blue-500'
    if (score >= 4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="text-green-400" size={20} />
      case 'declining':
        return <TrendingDown className="text-red-400" size={20} />
      default:
        return <Minus className="text-gray-400" size={20} />
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Scorecards de Maturidade</h1>
        <p className="text-gray-400">Avaliação de maturidade de engenharia por time</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Nome do time (ex: Backend Team)"
            className="w-full bg-[#1E1E1E] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchScorecard()
              }
            }}
          />
        </div>
        <button
          onClick={fetchScorecard}
          disabled={loading || !teamName.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-[#1B998B] hover:bg-[#15887a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Carregando...
            </>
          ) : (
            <>
              <BarChart3 size={18} />
              Buscar Scorecard
            </>
          )}
        </button>
      </div>

      {scorecard && (
        <div className="space-y-6">
          {/* Overall Score Card */}
          <div className="bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{scorecard.teamName}</h2>
                <p className="text-gray-400 text-sm">Scorecard de Maturidade</p>
              </div>
              <div className="flex items-center gap-4">
                {getTrendIcon(scorecard.trend)}
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getScoreColor(scorecard.overallScore)}`}>
                    {scorecard.overallScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">/ 10.0</div>
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getScoreBgColor(scorecard.overallScore)}`}
                style={{ width: `${(scorecard.overallScore / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scorecard.scores.map((score) => {
              const Icon = categoryIcons[score.category] || Target
              return (
                <div
                  key={score.category}
                  className={`bg-[#1E1E1E] border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-[#1B998B] ${
                    selectedCategory === score.category ? 'border-[#1B998B]' : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === score.category ? null : score.category)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className={getScoreColor(score.score)} size={24} />
                      <div>
                        <h3 className="font-bold text-white">{categoryLabels[score.category] || score.category}</h3>
                        <p className={`text-sm ${levelColors[score.level] || 'text-gray-400'}`}>
                          {score.level}
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                      {score.score.toFixed(1)}
                    </div>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${getScoreBgColor(score.score)}`}
                      style={{ width: `${(score.score / 10) * 100}%` }}
                    />
                  </div>

                  {score.recommendations && score.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">
                        {score.recommendations.length} recomendação(ões)
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Recommendations for Selected Category */}
          {selectedCategory && (
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">
                Recomendações - {categoryLabels[selectedCategory] || selectedCategory}
              </h3>
              {scorecard.scores
                .find(s => s.category === selectedCategory)
                ?.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 mb-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{rec.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        rec.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {rec.severity}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p><span className="font-semibold">Motivo:</span> {rec.reason}</p>
                      <p><span className="font-semibold">Ação:</span> {rec.action}</p>
                      <p><span className="font-semibold">Impacto:</span> {rec.impact}</p>
                    </div>
                  </div>
                ))}
              {(!scorecard.scores.find(s => s.category === selectedCategory)?.recommendations ||
                scorecard.scores.find(s => s.category === selectedCategory)?.recommendations.length === 0) && (
                <p className="text-gray-400 text-center py-4">
                  Nenhuma recomendação disponível para esta categoria
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!scorecard && !loading && (
        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-12 text-center">
          <Target className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-400 text-lg">Digite o nome do time para ver o scorecard</p>
          <p className="text-gray-500 text-sm mt-2">
            O scorecard mostra a maturidade em diferentes categorias de engenharia
          </p>
        </div>
      )}
    </div>
  )
}

export default MaturityPage

