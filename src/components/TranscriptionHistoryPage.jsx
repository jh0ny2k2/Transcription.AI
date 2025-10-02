import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TranscriptionHistory from './TranscriptionHistory'

const TranscriptionHistoryPage = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showSearchControls, setShowSearchControls] = useState(false)
  const [showFilterControls, setShowFilterControls] = useState(false)

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
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📚</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Historial de Transcripciones
                  </h1>
                  <p className="text-xs text-gray-500">Todas tus transcripciones anteriores</p>
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
                  <p className="text-xs text-gray-500">Revisando historial</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
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
          className="group flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 bg-white/50 hover:bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow-md mb-4"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Dashboard</span>
        </button>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Tu Historial de Transcripciones
          </h2>
          <p className="text-gray-600">
            Revisa, descarga y gestiona todas tus transcripciones anteriores
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/dashboard/new')}
            className="group bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Transcripción</span>
          </button>
          
          <button 
            onClick={() => setShowFilterControls(!showFilterControls)}
            className={`group ${showFilterControls ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white/70 text-gray-700 border-white/30'} backdrop-blur-sm hover:bg-white/90 px-6 py-3 rounded-xl font-medium transition-all duration-300 border hover:border-white/50 flex items-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filtrar</span>
          </button>
          
          <button 
            onClick={() => setShowSearchControls(!showSearchControls)}
            className={`group ${showSearchControls ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white/70 text-gray-700 border-white/30'} backdrop-blur-sm hover:bg-white/90 px-6 py-3 rounded-xl font-medium transition-all duration-300 border hover:border-white/50 flex items-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar</span>
          </button>
        </div>

        {/* Search and Filter Controls */}
        {(showSearchControls || showFilterControls) && (
          <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Control */}
              {showSearchControls && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Buscar transcripciones
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por título o contenido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              )}
              
              {/* Filter Controls */}
              {showFilterControls && (
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📊 Ordenar por
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="created_at">Fecha</option>
                      <option value="title">Título</option>
                      <option value="duration">Duración</option>
                      <option value="status">Estado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔄 Orden
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="desc">Descendente</option>
                      <option value="asc">Ascendente</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || sortBy !== 'created_at' || sortOrder !== 'desc') && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSortBy('created_at')
                    setSortOrder('desc')
                  }}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-300 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Limpiar filtros</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-8 py-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Mis Transcripciones</h3>
                  <p className="text-sm text-gray-600">Gestiona y organiza tus archivos de audio transcritos</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                  Activo
                </div>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <TranscriptionHistory 
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              hideControls={true}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">❓ ¿Necesitas ayuda?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Haz clic en cualquier transcripción para ver los detalles completos</li>
                <li>• Usa el botón de descarga para guardar el texto en tu dispositivo</li>
                <li>• Puedes eliminar transcripciones que ya no necesites</li>
                <li>• Las transcripciones se ordenan por fecha, las más recientes primero</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranscriptionHistoryPage
