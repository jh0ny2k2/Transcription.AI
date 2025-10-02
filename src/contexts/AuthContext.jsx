import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('🔍 Obteniendo sesión inicial...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error)
        }
        
        if (mounted) {
          console.log('📋 Sesión inicial obtenida:', session?.user?.email || 'No hay usuario')
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('💥 Error en getInitialSession:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Si es un nuevo usuario (registro o primer login con Google), guardarlo en la base de datos
          if (event === 'SIGNED_IN' && session?.user) {
            await saveUserToDatabase(session.user)
          }
          
          // Manejar específicamente el evento de logout
          if (event === 'SIGNED_OUT') {
            console.log('🚪 Usuario desconectado, limpiando estado...')
            setSession(null)
            setUser(null)
          }
          
          // Solo establecer loading false si no estamos en medio de una operación manual
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Función para guardar usuario en la base de datos
  const saveUserToDatabase = async (user) => {
    try {
      console.log('💾 Guardando usuario en la base de datos:', user.email)
      
      // Verificar si el usuario ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error verificando usuario existente:', checkError)
        return
      }
      
      // Si el usuario no existe, crearlo
      if (!existingUser) {
        const userData = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          provider: user.app_metadata?.provider || 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([userData])
        
        if (insertError) {
          console.error('❌ Error guardando usuario:', insertError)
        } else {
          console.log('✅ Usuario guardado exitosamente en la base de datos')
        }
      } else {
        console.log('ℹ️ Usuario ya existe en la base de datos')
      }
    } catch (error) {
      console.error('💥 Error en saveUserToDatabase:', error)
    }
  }

  // Función de registro
  const signUp = async (email, password, metadata = {}) => {
    try {
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
    }
  }

  // Función de inicio de sesión
  const signIn = async (email, password) => {
    try {
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
    }
  }

  // Función de cierre de sesión
  const signOut = async () => {
    try {
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

  // Función para autenticación con Google
  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Iniciando autenticación con Google...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        console.error('❌ Error en autenticación con Google:', error)
        return { error }
      }
      
      console.log('✅ Redirección a Google iniciada')
      return { data, error: null }
    } catch (error) {
      console.error('💥 Error capturado en signInWithGoogle:', error)
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
    updateProfile,
    signInWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider