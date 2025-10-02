import { supabase } from './supabase'

export class SubscriptionService {
  /**
   * Obtiene el plan actual del usuario
   */
  static async getCurrentPlan(userId) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error getting current plan:', error)
      return null
    }
  }

  /**
   * Obtiene todos los planes disponibles
   */
  static async getAvailablePlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting available plans:', error)
      return []
    }
  }

  /**
   * Verifica los límites de transcripción del usuario
   */
  static async checkTranscriptionLimits(userId) {
    try {
      const { data, error } = await supabase
        .rpc('check_transcription_limits', { user_uuid: userId })

      if (error) throw error
      
      return data[0] || {
        can_transcribe: false,
        current_week_usage: 0,
        week_limit: 4,
        current_month_usage: 0,
        month_limit: 16,
        plan_name: 'Free',
        unlimited: false
      }
    } catch (error) {
      console.error('Error checking transcription limits:', error)
      return {
        can_transcribe: false,
        current_week_usage: 0,
        week_limit: 4,
        current_month_usage: 0,
        month_limit: 16,
        plan_name: 'Free',
        unlimited: false
      }
    }
  }

  /**
   * Registra el uso de una transcripción
   */
  static async recordTranscriptionUsage(userId, transcriptionId, usageType = 'transcription', cost = 0) {
    try {
      const currentDate = new Date()
      const weekStart = this.getWeekStart(currentDate)
      const monthStart = this.getMonthStart(currentDate)

      console.log('📝 Registrando uso de transcripción:', {
        userId,
        transcriptionId,
        weekStart,
        monthStart,
        usageType,
        cost
      })

      const { data, error } = await supabase
        .from('transcription_usage')
        .insert({
          user_id: userId,
          transcription_id: transcriptionId,
          usage_type: usageType,
          cost: cost,
          week_start: weekStart,
          month_start: monthStart
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Uso registrado exitosamente:', data)
      return data
    } catch (error) {
      console.error('❌ Error recording transcription usage:', error)
      throw error
    }
  }

  /**
   * Suscribe al usuario a un plan
   */
  static async subscribeToPlan(userId, planId, paymentMethod = null, paymentId = null) {
    try {
      // Primero, cancelar suscripción activa si existe
      await this.cancelCurrentSubscription(userId)

      // Obtener información del plan
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) throw planError

      // Calcular fecha de expiración
      let expiresAt = null
      if (plan.billing_period === 'monthly') {
        expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else if (plan.billing_period === 'yearly') {
        expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      }

      // Crear nueva suscripción
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          expires_at: expiresAt,
          payment_method: paymentMethod,
          payment_id: paymentId
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error subscribing to plan:', error)
      throw error
    }
  }

  /**
   * Cancela la suscripción actual del usuario
   */
  static async cancelCurrentSubscription(userId) {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  /**
   * Procesa un pago por uso individual
   */
  static async processPayPerUse(userId, amount = 1.00) {
    try {
      // Aquí se integraría con el sistema de pagos (Stripe, PayPal, etc.)
      // Por ahora, simulamos el pago exitoso
      
      const paymentId = `ppu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Registrar el pago en la base de datos
      const { data, error } = await supabase
        .from('transcription_usage')
        .insert({
          user_id: userId,
          usage_type: 'pay_per_use',
          cost: amount,
          week_start: this.getWeekStart(new Date()),
          month_start: this.getMonthStart(new Date())
        })
        .select()
        .single()

      if (error) throw error
      
      return {
        success: true,
        paymentId: paymentId,
        amount: amount,
        usage: data
      }
    } catch (error) {
      console.error('Error processing pay per use:', error)
      throw error
    }
  }

  /**
   * Obtiene el historial de uso del usuario
   */
  static async getUsageHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('transcription_usage')
        .select(`
          *,
          transcriptions (title, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting usage history:', error)
      return []
    }
  }

  /**
   * Utilidades para fechas
   */
  static getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  }

  static getMonthStart(date) {
    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  }

  /**
   * Formatea el precio para mostrar
   */
  static formatPrice(price, currency = 'EUR') {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  /**
   * Calcula el porcentaje de uso
   */
  static calculateUsagePercentage(current, limit) {
    if (!limit || limit === 0) return 0
    return Math.min((current / limit) * 100, 100)
  }
}

// Exportar una instancia para uso directo
export const subscriptionService = SubscriptionService