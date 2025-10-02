import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const TranscriptionViewPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, signOut } = useAuth()
  const [transcription, setTranscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchTranscription()
    }
  }, [id])

  const fetchTranscription = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setTranscription(data)
    } catch (err) {
      setError('Error al cargar la transcripción: ' + err.message)
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'processing':
        return 'Procesando'
      case 'failed':
        return 'Error'
      default:
        return 'Desconocido'
    }
  }

  const copyToClipboard = async () => {
    if (transcription?.content) {
      try {
        await navigator.clipboard.writeText(transcription.content)
        alert('Texto copiado al portapapeles')
      } catch (err) {
        console.error('Error al copiar:', err)
        alert('Error al copiar el texto')
      }
    }
  }

  const downloadAsText = () => {
    if (transcription?.content) {
      const element = document.createElement('a')
      const file = new Blob([transcription.content], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `${transcription.title || 'transcripcion'}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando transcripción...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/history')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Volver al Historial
          </button>
        </div>
      </div>
    )
  }

  if (!transcription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transcripción no encontrada</h2>
          <p className="text-gray-600 mb-4">La transcripción que buscas no existe o no tienes permisos para verla.</p>
          <button
            onClick={() => navigate('/dashboard/history')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Volver al Historial
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-6">
              
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-lg">📄</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Ver Transcripción
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Detalles completos de la transcripción</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
              {/* User Info */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">Revisando transcripción</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* User Avatar for mobile/tablet */}
              <div className="lg:hidden w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs sm:text-sm">
                  {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

        <button
          onClick={() => navigate('/dashboard/history')}
          className="group flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 bg-white/50 hover:bg-white/80 px-3 py-2 sm:px-4 sm:py-2 rounded-xl shadow-sm hover:shadow-md mb-4 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Historial</span>
        </button>

        {/* Transcription Info */}
        <div className="mb-6 sm:mb-8 bg-white rounded-xl p-4 sm:p-6 shadow-xl border border-gray-200">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase text-gray-900 mb-2 break-words">
            {transcription.title || 'Sin título'}
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
            <span className="flex items-center">
              📅 <span className="ml-1">{formatDate(transcription.created_at)}</span>
            </span>
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transcription.status)}`}>
              {getStatusText(transcription.status)}
            </span>
            {transcription.content && (
              <span className="flex items-center">
                📊 <span className="ml-1">{transcription.content.length} caracteres</span>
              </span>
            )}
          </div>
        </div>

        

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Texto de la Transcripción</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Contenido completo transcrito del audio</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={copyToClipboard}
                  disabled={!transcription.content}
                  className="group bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copiar Texto</span>
                </button>
                
                <button
                  onClick={downloadAsText}
                  disabled={!transcription.content}
                  className="group bg-white/70 backdrop-blur-sm hover:bg-white/90 disabled:bg-gray-200 text-gray-700 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 border border-white/30 hover:border-white/50 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Descargar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {transcription.content ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base">
                  {transcription.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📝</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Sin contenido disponible</h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  Esta transcripción no tiene contenido disponible o aún está siendo procesada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Section */}
        {transcription.metadata && (
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-2">📊 Información Técnica</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  {transcription.metadata.language && (
                    <div className="bg-white/50 p-2 sm:p-3 rounded-lg">
                      <span className="font-medium">Idioma:</span> {transcription.metadata.language}
                    </div>
                  )}
                  {transcription.metadata.confidence && (
                    <div className="bg-white/50 p-2 sm:p-3 rounded-lg">
                      <span className="font-medium">Confianza:</span> {Math.round(transcription.metadata.confidence * 100)}%
                    </div>
                  )}
                  {transcription.metadata.model && (
                    <div className="bg-white/50 p-2 sm:p-3 rounded-lg">
                      <span className="font-medium">Modelo:</span> {transcription.metadata.model}
                    </div>
                  )}
                  {transcription.metadata.format && (
                    <div className="bg-white/50 p-2 sm:p-3 rounded-lg">
                      <span className="font-medium">Formato:</span> {transcription.metadata.format}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TranscriptionViewPage