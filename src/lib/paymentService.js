// Simulación de servicio de pagos (en producción sería Stripe, PayPal, etc.)
export class PaymentService {
  // Simular procesamiento de pago para suscripción
  static async processSubscriptionPayment(planId, amount, paymentMethod = 'card') {
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simular validación de tarjeta
      if (paymentMethod === 'card') {
        const cardValid = await this.validateCard()
        if (!cardValid) {
          throw new Error('Tarjeta de crédito inválida')
        }
      }
      
      // Simular procesamiento exitoso (95% de éxito)
      const success = Math.random() > 0.05
      
      if (!success) {
        throw new Error('El pago fue rechazado por el banco')
      }
      
      // Generar ID de transacción simulado
      const transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      return {
        success: true,
        transactionId,
        amount,
        currency: 'EUR',
        paymentMethod,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      }
    }
  }
  
  // Simular procesamiento de pago por uso
  static async processPayPerUsePayment(amount, description = 'Transcripción') {
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simular validación de fondos
      const hasFunds = Math.random() > 0.1 // 90% de éxito
      
      if (!hasFunds) {
        throw new Error('Fondos insuficientes')
      }
      
      const transactionId = 'ppu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      return {
        success: true,
        transactionId,
        amount,
        currency: 'EUR',
        description,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      }
    }
  }
  
  // Simular validación de tarjeta
  static async validateCard(cardNumber = '4242424242424242') {
    // Simular delay de validación
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Números de tarjeta de prueba válidos
    const validTestCards = [
      '4242424242424242', // Visa
      '4000056655665556', // Visa (debit)
      '5555555555554444', // Mastercard
      '2223003122003222', // Mastercard (2-series)
      '5200828282828210', // Mastercard (debit)
      '378282246310005',  // American Express
    ]
    
    return validTestCards.includes(cardNumber) || cardNumber.length === 16
  }
  
  // Obtener métodos de pago disponibles
  static getAvailablePaymentMethods() {
    return [
      {
        id: 'card',
        name: 'Tarjeta de Crédito/Débito',
        icon: '💳',
        description: 'Visa, Mastercard, American Express'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '🅿️',
        description: 'Paga con tu cuenta de PayPal'
      },
      {
        id: 'bank_transfer',
        name: 'Transferencia Bancaria',
        icon: '🏦',
        description: 'Transferencia directa desde tu banco'
      }
    ]
  }
  
  // Formatear precio
  static formatPrice(amount, currency = 'EUR') {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  // Calcular impuestos (IVA en España)
  static calculateTax(amount, taxRate = 0.21) {
    return {
      subtotal: amount,
      tax: amount * taxRate,
      total: amount * (1 + taxRate)
    }
  }
  
  // Generar factura simulada
  static generateInvoice(transactionData, userInfo) {
    const invoice = {
      invoiceNumber: 'INV-' + Date.now(),
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      customer: {
        name: userInfo.name || 'Usuario',
        email: userInfo.email,
        id: userInfo.id
      },
      items: [{
        description: transactionData.description || 'Suscripción Premium',
        quantity: 1,
        unitPrice: transactionData.amount,
        total: transactionData.amount
      }],
      ...this.calculateTax(transactionData.amount),
      paymentMethod: transactionData.paymentMethod,
      transactionId: transactionData.transactionId,
      status: 'paid'
    }
    
    return invoice
  }
  
  // Simular webhook de confirmación de pago
  static async simulateWebhook(transactionId, status = 'completed') {
    // En producción, esto sería un webhook real de Stripe/PayPal
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    return {
      event: 'payment.confirmed',
      transactionId,
      status,
      timestamp: new Date().toISOString(),
      verified: true
    }
  }
  
  // Manejar reembolsos
  static async processRefund(transactionId, amount, reason = 'Solicitud del cliente') {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const refundId = 'ref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      return {
        success: true,
        refundId,
        originalTransactionId: transactionId,
        amount,
        reason,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  // Obtener historial de transacciones (simulado)
  static async getTransactionHistory(userId, limit = 10) {
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generar historial simulado
    const transactions = []
    for (let i = 0; i < limit; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      transactions.push({
        id: 'txn_' + date.getTime(),
        type: Math.random() > 0.7 ? 'subscription' : 'pay_per_use',
        amount: Math.random() > 0.7 ? 15.99 : 1.00,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        description: Math.random() > 0.7 ? 'Suscripción Premium' : 'Transcripción',
        date: date.toISOString(),
        paymentMethod: 'card'
      })
    }
    
    return transactions
  }
  
  // Validar cupones de descuento
  static async validateCoupon(couponCode) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const validCoupons = {
      'WELCOME10': { discount: 0.10, type: 'percentage', description: '10% de descuento' },
      'FIRST5': { discount: 5, type: 'fixed', description: '5€ de descuento' },
      'PREMIUM20': { discount: 0.20, type: 'percentage', description: '20% de descuento en Premium' }
    }
    
    const coupon = validCoupons[couponCode.toUpperCase()]
    
    if (!coupon) {
      throw new Error('Cupón inválido o expirado')
    }
    
    return {
      valid: true,
      code: couponCode.toUpperCase(),
      ...coupon
    }
  }
  
  // Aplicar descuento
  static applyDiscount(amount, coupon) {
    if (coupon.type === 'percentage') {
      return {
        originalAmount: amount,
        discount: amount * coupon.discount,
        finalAmount: amount * (1 - coupon.discount)
      }
    } else {
      return {
        originalAmount: amount,
        discount: Math.min(coupon.discount, amount),
        finalAmount: Math.max(0, amount - coupon.discount)
      }
    }
  }
}

// Exportar una instancia para uso directo
export const paymentService = PaymentService
export default PaymentService