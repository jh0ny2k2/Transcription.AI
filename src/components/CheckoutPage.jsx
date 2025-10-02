import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { paymentService } from '../lib/paymentService'
import { subscriptionService } from '../lib/subscriptionService'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  
  // Get plan from navigation state
  const plan = location.state?.plan
  
  const [step, setStep] = useState('payment-method') // payment-method, card-details, processing, success, error
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  })
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethods] = useState(paymentService.getAvailablePaymentMethods())

  useEffect(() => {
    // If no plan is provided, redirect back to subscription plans
    if (!plan) {
      navigate('/dashboard/subscription')
      return
    }
    
    // Reset state when component mounts
    setStep('payment-method')
    setError('')
    setAppliedCoupon(null)
    setCouponCode('')
  }, [plan, navigate])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleCardInputChange = (field, value) => {
    let formattedValue = value

    if (field === 'number') {
      // Remove all non-digits and format with spaces
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim()
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19)
    } else if (field === 'expiry') {
      // Format as MM/YY
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5)
    } else if (field === 'cvc') {
      // Only allow digits, max 4
      formattedValue = value.replace(/\D/g, '').slice(0, 4)
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }))
  }

  const validateCardDetails = () => {
    if (!cardDetails.name.trim()) return 'Nombre del titular requerido'
    if (!cardDetails.number.replace(/\s/g, '') || cardDetails.number.replace(/\s/g, '').length < 13) return 'Número de tarjeta inválido'
    if (!cardDetails.expiry || cardDetails.expiry.length !== 5) return 'Fecha de vencimiento inválida'
    if (!cardDetails.cvc || cardDetails.cvc.length < 3) return 'CVC inválido'
    return null
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    
    try {
      setLoading(true)
      const result = await paymentService.validateCoupon(couponCode, plan.id)
      if (result.valid) {
        setAppliedCoupon(result.coupon)
        setError('')
      } else {
        setError(result.error || 'Cupón inválido')
      }
    } catch (error) {
      setError('Error al validar cupón')
    } finally {
      setLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  const calculateFinalAmount = () => {
    let amount = plan?.price || 0
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        amount = amount * (1 - appliedCoupon.value / 100)
      } else {
        amount = Math.max(0, amount - appliedCoupon.value)
      }
    }
    return amount
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError('')
      setStep('processing')
      
      const finalAmount = calculateFinalAmount()
      
      let paymentResult
      
      if (plan.name === 'Pay Per Use') {
          paymentResult = await paymentService.processPayPerUsePayment(finalAmount, 'Crédito para transcripciones')
        } else {
          paymentResult = await paymentService.processSubscriptionPayment(plan.id, finalAmount, selectedPaymentMethod)
        }
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error)
      }
      
      // Procesar suscripción en el backend
      await subscriptionService.subscribeToPlan(user.id, plan.id, selectedPaymentMethod, paymentResult.transactionId)
      
      setStep('success')
      
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            message: `¡Suscripción al plan ${plan.name} activada exitosamente!`,
            type: 'success'
          }
        })
      }, 3000)
      
    } catch (error) {
      console.error('Payment error:', error)
      setError(error.message || 'Error al procesar el pago')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const renderPaymentMethodStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Método de Pago
        </h3>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPaymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedPaymentMethod === method.id}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              {selectedPaymentMethod === method.id && (
                <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Coupon Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Código de Descuento</h4>
        {!appliedCoupon ? (
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={applyCoupon}
              disabled={!couponCode.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
            <div>
              <p className="text-sm font-medium text-green-800">
                Cupón aplicado: {appliedCoupon.code}
              </p>
              <p className="text-xs text-green-600">
                Descuento: {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : paymentService.formatPrice(appliedCoupon.value)}
              </p>
            </div>
            <button
              onClick={removeCoupon}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          onClick={() => setStep('card-details')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continuar
        </button>
      </div>
    </div>
  )

  const renderCardDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalles de la Tarjeta
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Titular
            </label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) => handleCardInputChange('name', e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Tarjeta
            </label>
            <input
              type="text"
              value={cardDetails.number}
              onChange={(e) => handleCardInputChange('number', e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="text"
                value={cardDetails.cvc}
                onChange={(e) => handleCardInputChange('cvc', e.target.value)}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => setStep('payment-method')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Atrás
        </button>
        <button
          onClick={handlePayment}
          disabled={!!validateCardDetails()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pagar {paymentService.formatPrice(calculateFinalAmount())}
        </button>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Procesando Pago...
      </h3>
      <p className="text-gray-600">
        Por favor espera mientras procesamos tu pago de forma segura.
      </p>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        ¡Pago Exitoso!
      </h3>
      <p className="text-gray-600 mb-4">
        Tu suscripción al plan {plan?.name} ha sido activada.
      </p>
      <p className="text-sm text-gray-500">
        Serás redirigido al dashboard en unos segundos...
      </p>
    </div>
  )

  const renderErrorStep = () => (
    <div className="text-center py-8">
      <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Error en el Pago
      </h3>
      <p className="text-red-600 mb-4">
        {error}
      </p>
      <div className="space-x-4">
        <button
          onClick={() => setStep('payment-method')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Intentar de Nuevo
        </button>
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )

  if (!plan) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💳</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Checkout
                  </h1>
                  <p className="text-xs text-gray-500">Finalizar suscripción</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">Procesando pago</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="group flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow-md mb-8"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Volver a Planes</span>
        </button>

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-8 py-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {plan?.name} - {paymentService.formatPrice(plan?.price || 0)}
                </h2>
                {appliedCoupon && (
                  <p className="text-lg text-green-600 font-semibold">
                    Total: {paymentService.formatPrice(calculateFinalAmount())}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Plan seleccionado</p>
                <p className="text-lg font-semibold text-indigo-600">{plan?.name}</p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {/* Error Message */}
            {error && step !== 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Content */}
            {step === 'payment-method' && renderPaymentMethodStep()}
            {step === 'card-details' && renderCardDetailsStep()}
            {step === 'processing' && renderProcessingStep()}
            {step === 'success' && renderSuccessStep()}
            {step === 'error' && renderErrorStep()}
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">🔒 Pago Seguro</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Encriptación SSL de 256 bits</li>
                <li>• Procesamiento seguro de pagos</li>
                <li>• No almacenamos datos de tarjetas</li>
                <li>• Cumplimiento PCI DSS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage