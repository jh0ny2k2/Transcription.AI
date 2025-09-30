import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error obteniendo sesión inicial:', error)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error en getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Función de registro
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true)
      console.log('🚀 Iniciando registro:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (error) {
        console.error('❌ Error de registro:', error)
        return { error }
      }
      
      console.log('✅ Registro exitoso:', data)
      return { data, error: null }
    } catch (error) {
      console.error('💥 Error capturado en signUp:', error)
      return { error: { message: error.message } }
    } finally {
      setLoading(false)
    }
  }

  // Función de inicio de sesión
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      console.log('🚀 Iniciando login:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('❌ Error de login:', error)
        return { error }
      }
      
      console.log('✅ Login exitoso:', data)
      return { data, error: null }
    } catch (error) {
      console.error('💥 Error capturado en signIn:', error)
      return { error: { message: error.message } }
    } finally {
      setLoading(false)
    }
  }

  // Función de cierre de sesión
  const signOut = async () => {
    try {
      setLoading(true)
      console.log('🚀 Cerrando sesión...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Error al cerrar sesión:', error)
        return { error }
      }
      
      console.log('✅ Sesión cerrada exitosamente')
      return { error: null }
    } catch (error) {
      console.error('💥 Error capturado en signOut:', error)
      return { error: { message: error.message } }
    } finally {
      setLoading(false)
    }
  }

  // Función para resetear contraseña
  const resetPassword = async (email) => {
    try {
      console.log('🚀 Enviando reset de contraseña:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        console.error('❌ Error al enviar reset:', error)
        return { error }
      }
      
      console.log('✅ Email de reset enviado')
      return { error: null }
    } catch (error) {
      console.error('💥 Error capturado en resetPassword:', error)
      return { error: { message: error.message } }
    }
  }

  // Función para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      console.log('🚀 Actualizando perfil:', profileData)
      
      const { data, error } = await supabase.auth.updateUser({
        data: profileData
      })
      
      if (error) {
        console.error('❌ Error al actualizar perfil:', error)
        return { error }
      }
      
      console.log('✅ Perfil actualizado exitosamente:', data)
      return { data, error: null }
    } catch (error) {
      console.error('💥 Error capturado en updateProfile:', error)
      return { error: { message: error.message } }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider