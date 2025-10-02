import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const TranscriptionHistory = ({ 
  searchTerm: externalSearchTerm, 
  sortBy: externalSortBy, 
  sortOrder: externalSortOrder, 
  hideControls = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Usar props externos si están disponibles, sino usar estados internos
  const activeSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : searchTerm;
  const activeSortBy = externalSortBy !== undefined ? externalSortBy : sortBy;
  const activeSortOrder = externalSortOrder !== undefined ? externalSortOrder : sortOrder;

  useEffect(() => {
    loadTranscriptions();
  }, [user, activeSortBy, activeSortOrder]);

  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id)
        .order(activeSortBy, { ascending: activeSortOrder === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTranscriptions(data || []);
    } catch (err) {
      setError('Error al cargar las transcripciones: ' + err.message);
      console.error('Error loading transcriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewTranscription = (transcription) => {
    navigate(`/dashboard/transcription/${transcription.id}`);
  };

  const deleteTranscription = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setTranscriptions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Error al eliminar la transcripción: ' + err.message);
    }
  };

  const filteredTranscriptions = transcriptions.filter(transcription =>
    transcription.title?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
    transcription.content?.toLowerCase().includes(activeSearchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'processing':
        return 'Procesando';
      case 'failed':
        return 'Fallida';
      default:
        return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando transcripciones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls - Solo mostrar si hideControls es false */}
      {!hideControls && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar transcripciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="created_at">Fecha</option>
              <option value="title">Título</option>
              <option value="duration">Duración</option>
              <option value="status">Estado</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Transcriptions List */}
      {filteredTranscriptions.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-400 text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron transcripciones' : 'No tienes transcripciones aún'}
          </h3>
          <p className="text-sm sm:text-base text-gray-500">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primera transcripción para comenzar'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="bg-white border-2 border-gray-100 rounded-xl p-4 sm:p-6 shadow-xl transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {transcription.title || 'Sin título'}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                    <span>📅 {formatDate(transcription.created_at)}</span>
                    <span>⏱️ {formatDuration(transcription.processing_time)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transcription.status)} self-start sm:self-auto`}>
                      {getStatusText(transcription.status)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 sm:ml-4">
                  <button
                    onClick={() => viewTranscription(transcription)}
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium border-2 rounded-lg px-3 sm:px-4 py-1 flex-1 sm:flex-none"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => deleteTranscription(transcription.id)}
                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium border-2 rounded-lg px-3 sm:px-4 py-1 flex-1 sm:flex-none"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              {transcription.content && (
                <div className="bg-gray-50 rounded-md p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">
                    {transcription.content.substring(0, 150)}
                    {transcription.content.length > 150 && '...'}
                  </p>
                </div>
              )}
              
              {transcription.metadata && (
                <div className="mt-2 sm:mt-3 text-xs text-gray-500 flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                  {transcription.metadata.language && (
                    <span>🌐 {transcription.metadata.language}</span>
                  )}
                  {transcription.metadata.confidence && (
                    <span>📊 Confianza: {Math.round(transcription.metadata.confidence * 100)}%</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default TranscriptionHistory;