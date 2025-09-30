import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/dashboard/history')}
                className="group flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Historial</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📄</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Ver Transcripción
                  </h1>
                  <p className="text-xs text-gray-500">Detalles completos de la transcripción</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3 ">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {/* Transcription Info */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-xl border border-gray-200">
          <h2 className="text-3xl font-bold uppercase text-gray-900 mb-2">
            {transcription.title || 'Sin título'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-600">
            <span className="flex items-center">
              📅 {formatDate(transcription.created_at)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transcription.status)}`}>
              {getStatusText(transcription.status)}
            </span>
            {transcription.content && (
              <span className="flex items-center">
                📊 {transcription.content.length} caracteres
              </span>
            )}
          </div>
        </div>

        

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 px-8 py-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Texto de la Transcripción</h3>
                  <p className="text-sm text-gray-600">Contenido completo transcrito del audio</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={copyToClipboard}
                  disabled={!transcription.content}
                  className="group bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copiar Texto</span>
                </button>
                
                <button
                  onClick={downloadAsText}
                  disabled={!transcription.content}
                  className="group bg-white/70 backdrop-blur-sm hover:bg-white/90 disabled:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 border border-white/30 hover:border-white/50 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Descargar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {transcription.content ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                  {transcription.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin contenido disponible</h3>
                <p className="text-gray-600">
                  Esta transcripción no tiene contenido disponible o aún está siendo procesada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Section */}
        {transcription.metadata && (
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">📊 Información Técnica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {transcription.metadata.language && (
                    <div>
                      <span className="font-medium">Idioma:</span> {transcription.metadata.language}
                    </div>
                  )}
                  {transcription.metadata.confidence && (
                    <div>
                      <span className="font-medium">Confianza:</span> {Math.round(transcription.metadata.confidence * 100)}%
                    </div>
                  )}
                  {transcription.metadata.model && (
                    <div>
                      <span className="font-medium">Modelo:</span> {transcription.metadata.model}
                    </div>
                  )}
                  {transcription.metadata.format && (
                    <div>
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