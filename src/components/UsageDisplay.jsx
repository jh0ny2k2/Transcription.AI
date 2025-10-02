import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { subscriptionService } from '../lib/subscriptionService'

const UsageDisplay = ({ compact = false }) => {
  const { user } = useAuth()
  const [usage, setUsage] = useState(null)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadUsageData()
    }
  }, [user])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      const [usageData, planData] = await Promise.all([
        subscriptionService.getUsageHistory(user.id),
        subscriptionService.getCurrentPlan(user.id)
      ])
      
      setUsage(usageData)
      setCurrentPlan(planData)
    } catch (error) {
      console.error('Error loading usage data:', error)
      setError('Error al cargar los datos de uso')
    } finally {
      setLoading(false)
    }
  }

  const getWeeklyUsage = () => {
    if (!usage || !usage.length) return 0
    
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    return usage.filter(record => 
      new Date(record.created_at) >= oneWeekAgo
    ).length
  }

  const getUsagePercentage = () => {
    if (!currentPlan || currentPlan.subscription_plans.name !== 'Free') return 0
    
    const weeklyUsage = getWeeklyUsage()
    const limit = 4 // Free plan limit
    return Math.min((weeklyUsage / limit) * 100, 100)
  }

  const getRemainingTranscriptions = () => {
    if (!currentPlan || currentPlan.subscription_plans.name !== 'Free') return null
    
    const weeklyUsage = getWeeklyUsage()
    const limit = 4
    return Math.max(limit - weeklyUsage, 0)
  }

  const getProgressBarColor = () => {
    const percentage = getUsagePercentage()
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getNextResetDate = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    
    return nextMonday.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-2 sm:p-3' : 'p-4 sm:p-6'} bg-white rounded-lg shadow-sm border`}>
        <div className="animate-pulse">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-2 sm:p-3' : 'p-4 sm:p-6'} bg-red-50 border border-red-200 rounded-lg`}>
        <p className="text-red-700 text-xs sm:text-sm">{error}</p>
      </div>
    )
  }

  if (!currentPlan) {
    return null
  }

  // Compact version for header/sidebar
  if (compact) {
    if (currentPlan.subscription_plans.name === 'Free') {
      const remaining = getRemainingTranscriptions()
      const percentage = getUsagePercentage()
      
      return (
        <div className="bg-white rounded-lg shadow-sm border p-2 sm:p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Transcripciones
            </span>
            <span className={`text-xs sm:text-sm font-bold ${remaining === 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {remaining}/4
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-1">
            <div 
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500">
            {remaining === 0 ? 'Límite alcanzado' : `${remaining} restantes esta semana`}
          </p>
        </div>
      )
    } else {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-2 sm:p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-900">
                {currentPlan.subscription_plans.name}
              </p>
              <p className="text-xs text-gray-500">
                {currentPlan.subscription_plans.name === 'Premium' ? 'Ilimitado' : 'Por uso'}
              </p>
            </div>
          </div>
        </div>
      )
    }
  }

  // Full version for dedicated usage page
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Tu Uso de Transcripciones
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Monitorea tu consumo y límites actuales
          </p>
        </div>

        {/* Current Plan Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                Plan Actual: {currentPlan.subscription_plans.name}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {currentPlan.subscription_plans.description}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {subscriptionService.formatPrice(currentPlan.subscription_plans.price)}
                {currentPlan.subscription_plans.billing_period === 'monthly' && '/mes'}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        {currentPlan.subscription_plans.name === 'Free' ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Weekly Usage */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                  Uso Semanal
                </h4>
                <span className="text-xs sm:text-sm text-gray-500">
                  Se reinicia cada lunes
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Transcripciones utilizadas
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {getWeeklyUsage()}/4
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div 
                    className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                    style={{ width: `${getUsagePercentage()}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {getRemainingTranscriptions()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Restantes</p>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    Próximo reinicio
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    {getNextResetDate()}
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Suggestion */}
            {getUsagePercentage() >= 75 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                      ¡Estás cerca del límite!
                    </h4>
                    <p className="text-sm sm:text-base text-yellow-700 mb-4">
                      Has usado {getWeeklyUsage()} de tus 4 transcripciones semanales. 
                      Considera actualizar a Premium para transcripciones ilimitadas.
                    </p>
                    <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors w-full sm:w-auto">
                      Ver Planes Premium
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              ¡Sin Límites!
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              {currentPlan.subscription_plans.name === 'Premium' 
                ? 'Disfruta de transcripciones ilimitadas con tu plan Premium'
                : 'Paga solo por lo que uses con el plan Pay Per Use'
              }
            </p>
          </div>
        )}

        {/* Recent Usage History */}
        {usage && usage.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Historial Reciente
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {usage.slice(0, 10).map((record, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 px-3 bg-white rounded space-y-1 sm:space-y-0">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">
                      Transcripción #{record.id}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsageDisplay
