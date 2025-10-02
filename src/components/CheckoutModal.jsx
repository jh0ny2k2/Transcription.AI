import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../hooks/useAuth'
import { paymentService } from '../lib/paymentService'
import { subscriptionService } from '../lib/subscriptionService'

const CheckoutModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const { user } = useAuth()
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
    if (isOpen) {
      setStep('payment-method')
      setError('')
      setAppliedCoupon(null)
      setCouponCode('')
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      // Add escape key listener
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    try {
      setLoading(true)
      const coupon = await paymentService.validateCoupon(couponCode)
      setAppliedCoupon(coupon)
      setError('')
    } catch (error) {
      setError(error.message)
      setAppliedCoupon(null)
    } finally {
      setLoading(false)
    }
  }

  const calculateFinalAmount = () => {
    if (!plan) return 0
    
    let amount = plan.price
    
    if (appliedCoupon) {
      const discountResult = paymentService.applyDiscount(amount, appliedCoupon)
      return discountResult.finalAmount
    }
    
    return amount
  }

  const handleCardInputChange = (field, value) => {
    let formattedValue = value
    
    if (field === 'number') {
      // Formatear número de tarjeta (espacios cada 4 dígitos)
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      if (formattedValue.length > 19) return // Máximo 16 dígitos + 3 espacios
    } else if (field === 'expiry') {
      // Formatear fecha MM/YY
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
      if (formattedValue.length > 5) return
    } else if (field === 'cvc') {
      // Solo números, máximo 4 dígitos
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 4) return
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }))
  }

  const validateCardDetails = () => {
    const { number, expiry, cvc, name } = cardDetails
    
    if (!name.trim()) return 'Nombre del titular requerido'
    if (!number.replace(/\s/g, '') || number.replace(/\s/g, '').length < 16) return 'Número de tarjeta inválido'
    if (!expiry || expiry.length < 5) return 'Fecha de vencimiento inválida'
    if (!cvc || cvc.length < 3) return 'CVC inválido'
    
    // Validar fecha de vencimiento
    const [month, year] = expiry.split('/')
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1
    
    if (parseInt(month) < 1 || parseInt(month) > 12) return 'Mes inválido'
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return 'Tarjeta vencida'
    }
    
    return null
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
      
      // Llamar callback de éxito después de un delay
      setTimeout(() => {
        onSuccess && onSuccess(plan, paymentResult)
        onClose()
      }, 2000)
      
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

      {/* Cupón de descuento */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Código de Descuento (Opcional)
        </h4>
        <div className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Ingresa tu código"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode.trim()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar
          </button>
        </div>
        {appliedCoupon && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            ✓ {appliedCoupon.description} aplicado
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          onClick={() => selectedPaymentMethod === 'card' ? setStep('card-details') : handlePayment()}
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
      <p className="text-gray-600">
        Tu suscripción al plan {plan?.name} ha sido activada.
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
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" 
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative transform transition-all duration-300 scale-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {plan?.name} - {paymentService.formatPrice(plan?.price || 0)}
              </h2>
              {appliedCoupon && (
                <p className="text-sm text-green-600">
                  Total: {paymentService.formatPrice(calculateFinalAmount())}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && step !== 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
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
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default CheckoutModal