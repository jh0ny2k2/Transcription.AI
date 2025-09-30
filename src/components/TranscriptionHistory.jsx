import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar transcripciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Fecha</option>
              <option value="title">Título</option>
              <option value="duration">Duración</option>
              <option value="status">Estado</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Transcriptions List */}
      {filteredTranscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron transcripciones' : 'No tienes transcripciones aún'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'Crea tu primera transcripción para comenzar'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {transcription.title || 'Sin título'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📅 {formatDate(transcription.created_at)}</span>
                    <span>⏱️ {formatDuration(transcription.duration)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transcription.status)}`}>
                      {getStatusText(transcription.status)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewTranscription(transcription)}
                    className="text-blue-600  hover:text-blue-800 text-sm font-medium border-2 rounded-lg px-4 py-1"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => deleteTranscription(transcription.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium border-2 rounded-lg px-4 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              {transcription.content && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {transcription.content.substring(0, 200)}
                    {transcription.content.length > 200 && '...'}
                  </p>
                </div>
              )}
              
              {transcription.metadata && (
                <div className="mt-3 text-xs text-gray-500">
                  {transcription.metadata.language && (
                    <span className="mr-4">🌐 {transcription.metadata.language}</span>
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