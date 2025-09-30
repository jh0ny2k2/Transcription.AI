import React, { useState, useEffect } from 'react';
import { transcribeAudioFileFree } from '../lib/audioTranscription';
import { supabase } from '../lib/supabase';

const TranscriptionProgress = ({ 
  audioFile, 
  transcriptionTitle, 
  onComplete, 
  onCancel,
  transcriptionId 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [stage, setStage] = useState('preparing'); // preparing, listening, transcribing, completed, error
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(true); // Por defecto silenciado

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioFile]);

  useEffect(() => {
    if (!audioFile) return;

    const startRealTranscription = async () => {
      try {
        setStage('preparing');
        setProgress(10);
        setCurrentText('Preparando archivo de audio para transcripción...\n\n');

        setProgress(20);
        setCurrentText(prev => prev + 'Iniciando proceso de transcripción...\n\n');

        // Iniciar transcripción real con Whisper API
        const transcriptionResult = await transcribeAudioFileFree(
          audioFile,
          'es',
          (progressData) => {
            // Callback de progreso
            switch (progressData.stage) {
              case 'preparing':
                setStage('preparing');
                setProgress(30);
                setCurrentText(prev => prev + 'Configurando reconocimiento de voz...\n\n');
                break;
              case 'uploading':
                setStage('uploading');
                setProgress(50);
                setCurrentText(prev => prev + 'Enviando archivo a la IA...\n\n');
                break;
              case 'processing':
                setStage('processing');
                setProgress(70);
                setCurrentText(prev => prev + 'Procesando audio con IA...\n\n');
                break;
              case 'completed':
                setStage('completed');
                setProgress(90);
                setCurrentText(prev => prev + 'Transcripción completada...\n\n');
                break;
              case 'error':
                setStage('error');
                setCurrentText(prev => prev + `Error: ${progressData.text}\n\n`);
                break;
            }
          }
        );

        // Transcripción completada
        setProgress(95);
        setStage('completed');
        
        // Actualizar el texto final en la interfaz
        setCurrentText(prev => {
          const lines = prev.split('\n\n');
          const staticLines = lines.slice(0, 4); // Mantener las primeras 4 líneas de estado
          return staticLines.join('\n\n') + '\n\n' + (transcriptionResult || 'No se pudo transcribir el audio.');
        });
        
        // Guardar en la base de datos
        if (transcriptionId && transcriptionResult) {
          await supabase
            .from('transcriptions')
            .update({
              content: transcriptionResult,
              status: 'completed'
            })
            .eq('id', transcriptionId);
        }

        setProgress(100);
        setCurrentText(prev => prev + '\n\n¡Transcripción completada exitosamente!');
        setIsProcessing(false);

        // No cerrar automáticamente - dejar que el usuario decida

      } catch (err) {
        console.error('Error en transcripción:', err);
        setError(err.message);
        setStage('error');
        setIsProcessing(false);
        
        // Actualizar estado en la base de datos
        if (transcriptionId) {
          await supabase
            .from('transcriptions')
            .update({
              status: 'failed'
            })
            .eq('id', transcriptionId);
        }
      }
    };

    startRealTranscription();
  }, [audioFile, transcriptionId, onComplete]);

  const getStageText = () => {
    switch (stage) {
      case 'preparing':
        return 'Preparando transcripción...';
      case 'uploading':
        return 'Enviando archivo a la IA...';
      case 'processing':
        return 'Procesando audio con IA...';
      case 'completed':
        return '¡Transcripción completada!';
      case 'error':
        return 'Error en la transcripción';
      default:
        return 'Procesando...';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'preparing':
        return '⚙️';
      case 'uploading':
        return '📤';
      case 'processing':
        return '🤖';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Transcribiendo Audio</h2>
              <p className="text-blue-100 mt-1">{transcriptionTitle}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-red-200 transition-colors"
              title="Cancelar transcripción"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-3xl animate-pulse">{getStageIcon()}</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-800">{getStageText()}</span>
                <span className="text-lg font-bold text-blue-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Audio Info */}
          {audioFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{audioFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {audioFile.type}
                  </p>
                </div>
                {audioUrl && (
                  <audio controls className="max-w-xs">
                    <source src={audioUrl} type={audioFile.type} />
                    Tu navegador no soporta el elemento de audio.
                  </audio>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transcription Preview */}
        <div className="p-6 flex-1 overflow-y-auto max-h-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">📝</span>
              Texto de la Transcripción
              {currentText && (
                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {currentText.length} caracteres
                </span>
              )}
            </h3>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isMuted 
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title={isMuted ? 'Activar audio' : 'Silenciar audio'}
            >
              {isMuted ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  Silenciado
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Con Audio
                </>
              )}
            </button>
          </div>
          
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 min-h-40 shadow-sm">
            {currentText ? (
              <div className="space-y-2">
                <p className="text-gray-900 text-base leading-relaxed whitespace-pre-line font-medium">
                  {currentText}
                  {isProcessing && (
                    <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                  )}
                </p>
                {stage === 'listening' && (
                  <div className="mt-4 flex items-center text-blue-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium">Escuchando y transcribiendo...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="font-medium">Preparando transcripción...</p>
                  <p className="text-sm mt-1">El audio se reproducirá en volumen bajo</p>
                </div>
              </div>
            )}
          </div>

          {stage === 'completed' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                     <p className="text-green-800 font-semibold">¡Transcripción completada exitosamente!</p>
                     <p className="text-green-600 text-sm">Puedes revisar el texto y cerrar cuando quieras.</p>
                   </div>
                 </div>
                 <button
                   onClick={onComplete}
                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                 >
                   Finalizar
                 </button>
               </div>
             </div>
           )}

          {stage === 'error' && error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold">Error en la transcripción</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Procesando con IA avanzada
              </span>
            </div>
            <div className="text-sm text-gray-500">
              ID: {transcriptionId?.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionProgress;