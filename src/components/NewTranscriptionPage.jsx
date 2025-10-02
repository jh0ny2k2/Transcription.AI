import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import NewTranscription from './NewTranscription'
import { subscriptionService } from '../lib/subscriptionService'
import { useState, useEffect } from 'react'

const NewTranscriptionPage = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [canTranscribe, setCanTranscribe] = useState(true)
  const [limitInfo, setLimitInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      checkTranscriptionLimit()
    }
  }, [user?.id])

  const checkTranscriptionLimit = async () => {
    try {
      setLoading(true)
      console.log('🔍 Verificando límites de transcripción para usuario:', user.id)
      const result = await subscriptionService.checkTranscriptionLimits(user.id)
      console.log('📊 Resultado de límites:', result)
      setCanTranscribe(result.can_transcribe)
      setLimitInfo(result)
    } catch (error) {
      console.error('❌ Error checking transcription limit:', error)
      // En caso de error, permitir transcripción por defecto
      setCanTranscribe(true)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
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
                  <span className="text-white font-bold text-lg">🎤</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Nueva Transcripción
                  </h1>
                  <p className="text-xs text-gray-500">Convierte tu audio en texto</p>
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
                  <p className="text-xs text-gray-500">Transcribiendo</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <button
          onClick={() => navigate('/dashboard')}
          className="group flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow-md mb-5"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Dashboard</span>
        </button>


        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Crear Nueva Transcripción
          </h2>
          <p className="text-gray-600">
            Sube tu archivo de audio y obtén una transcripción precisa en segundos
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-8 py-6 border-b border-white/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Subir Archivo de Audio</h3>
                <p className="text-sm text-gray-600">Formatos soportados: MP3, WAV, M4A (máx. 100MB)</p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Verificando límites...</span>
              </div>
            ) : !canTranscribe ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Límite de Transcripciones Alcanzado</h3>
                <p className="text-gray-600 mb-6">
                  Has alcanzado tu límite de {limitInfo?.weeklyLimit || 4} transcripciones semanales.
                  {limitInfo?.resetDate && (
                    <span className="block mt-1">
                      Tu límite se reiniciará el {new Date(limitInfo.resetDate).toLocaleDateString('es-ES')}.
                    </span>
                  )}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/dashboard/subscription')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Ver Planes Premium
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/usage')}
                    className="w-full bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-all duration-300"
                  >
                    Ver Mi Uso
                  </button>
                </div>
              </div>
            ) : (
              <NewTranscription onTranscriptionComplete={checkTranscriptionLimit} />
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">💡 Consejos para mejores resultados</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Usa archivos con audio claro y sin ruido de fondo</li>
                <li>• Habla de forma clara y a velocidad normal</li>
                <li>• Evita música de fondo o sonidos ambientales fuertes</li>
                <li>• Los archivos en español funcionan perfectamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewTranscriptionPage