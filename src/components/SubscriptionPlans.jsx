import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscriptionService } from '../lib/subscriptionService'

const SubscriptionPlans = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [plansData, currentPlanData] = await Promise.all([
        subscriptionService.getAvailablePlans(),
        subscriptionService.getCurrentPlan(user.id)
      ])
      
      setPlans(plansData)
      setCurrentPlan(currentPlanData)
    } catch (error) {
      console.error('Error loading subscription data:', error)
      setError('Error al cargar los planes de suscripción')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = (plan) => {
    if (plan.name === 'Free') {
      // Para el plan gratuito, suscribir directamente
      handleFreeSubscription(plan)
    } else {
      // Para planes de pago, navegar a la página de checkout
      navigate('/dashboard/checkout', { state: { plan } })
    }
  }

  const handleFreeSubscription = async (plan) => {
    try {
      setSubscribing(plan.id)
      setError('')
      setSuccess('')

      await subscriptionService.subscribeToPlan(user.id, plan.id, 'free', 'free_plan')
      
      setSuccess(`¡Te has suscrito exitosamente al plan ${plan.name}!`)
      await loadData() // Recargar datos
      
    } catch (error) {
      console.error('Error subscribing to free plan:', error)
      setError(error.message || 'Error al procesar la suscripción')
    } finally {
      setSubscribing(null)
    }
  }



  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'Free':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'Premium':
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      case 'Pay Per Use':
        return (
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      default:
        return null
    }
  }

  const isCurrentPlan = (planId) => {
    return currentPlan?.plan_id === planId
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Planes de Suscripción
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
          Elige el plan que mejor se adapte a tus necesidades de transcripción
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
          {success}
        </div>
      )}

      {/* Current Plan */}
      {currentPlan && (
        <div className="mb-6 sm:mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
            Tu Plan Actual
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {getPlanIcon(currentPlan.subscription_plans.name)}
            <div>
              <p className="font-medium text-blue-800 text-sm sm:text-base">
                {currentPlan.subscription_plans.name}
              </p>
              <p className="text-xs sm:text-sm text-blue-600">
                {currentPlan.subscription_plans.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
              isCurrentPlan(plan.id)
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            } ${plan.name === 'Premium' ? 'lg:transform lg:scale-105' : ''}`}
          >
            {/* Popular Badge */}
            {plan.name === 'Premium' && (
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                  Más Popular
                </span>
              </div>
            )}

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Plan Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  {plan.description}
                </p>
                
                {/* Price */}
                <div className="mb-4 sm:mb-6">
                  {plan.price === 0 ? (
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">Gratis</span>
                  ) : (
                    <div>
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                        {subscriptionService.formatPrice(plan.price)}
                      </span>
                      {plan.billing_period === 'monthly' && (
                        <span className="text-sm sm:text-base text-gray-600 ml-2">/mes</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {plan.name === 'Free' && (
                  <>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">4 transcripciones por semana</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Calidad estándar</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Soporte de la comunidad</span>
                    </div>
                  </>
                )}

                {plan.name === 'Premium' && (
                  <>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700 font-medium">Transcripciones ilimitadas</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Calidad premium</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Soporte prioritario</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Sin anuncios</span>
                    </div>
                  </>
                )}

                {plan.name === 'Pay Per Use' && (
                  <>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">1€ por transcripción</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Sin límites semanales</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base text-gray-700">Paga solo lo que uses</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={subscribing === plan.id || isCurrentPlan(plan.id)}
                className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                  isCurrentPlan(plan.id)
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.name === 'Premium'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                } ${subscribing === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {subscribing === plan.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </div>
                ) : isCurrentPlan(plan.id) ? (
                  'Plan Actual'
                ) : plan.name === 'Free' ? (
                  'Seleccionar Plan Gratuito'
                ) : (
                  `Suscribirse por ${subscriptionService.formatPrice(plan.price)}`
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 sm:mt-12 text-center">
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
          ¿Tienes preguntas sobre nuestros planes?
        </p>
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
          Contacta con soporte
        </button>
      </div>

    </div>
  )
}

export default SubscriptionPlans