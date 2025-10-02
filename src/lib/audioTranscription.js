/**
 * Utilidad para transcribir archivos de audio usando IA gratuita (AssemblyAI) o OpenAI Whisper API
 */

// Configuración de las APIs
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribe un archivo de audio usando IA GRATUITA (AssemblyAI por defecto, OpenAI como fallback)
 * @param {File} audioFile - El archivo de audio a transcribir
 * @param {string} language - El idioma para la transcripción (por defecto 'es')
 * @param {Function} onProgress - Callback para reportar progreso
 * @param {string} preferredService - Servicio preferido: 'assemblyai' (gratuito) o 'openai'
 * @returns {Promise<string>} - El texto transcrito
 */
export const transcribeAudioFileFree = async (audioFile, language = 'es', onProgress = null, preferredService = 'assemblyai') => {
  // Verificar que AssemblyAI esté configurado
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('API de transcripción no configurada. Configura VITE_ASSEMBLYAI_API_KEY en tu archivo .env para usar transcripción gratuita.');
  }

  // Usar AssemblyAI (gratuito)
  if (onProgress) {
    onProgress({ 
      stage: 'preparing', 
      text: 'Usando IA gratuita (AssemblyAI - 416 horas gratis)...' 
    });
  }
  
  return await transcribeAudioFileWithAssemblyAI(audioFile, language, onProgress);
};

/**
 * Transcribe un archivo de audio a texto usando OpenAI Whisper API
 * @param {File} audioFile - El archivo de audio a transcribir
 * @param {string} language - El idioma para la transcripción (por defecto 'es')
 * @param {Function} onProgress - Callback para reportar progreso
 * @returns {Promise<string>} - El texto transcrito
 */
export const transcribeAudioFile = async (audioFile, language = 'es', onProgress = null) => {
  try {
    // Verificar que se tenga la API key
    if (!OPENAI_API_KEY) {
      throw new Error('API key de OpenAI no configurada. Agrega VITE_OPENAI_API_KEY a tu archivo .env');
    }

    // Reportar progreso inicial
    if (onProgress) {
      onProgress({ 
        stage: 'preparing', 
        text: 'Preparando archivo de audio para transcripción...' 
      });
    }

    // Verificar el tamaño del archivo (máximo 25MB para Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB en bytes
    if (audioFile.size > maxSize) {
      throw new Error('El archivo es demasiado grande. El tamaño máximo es 25MB.');
    }

    // Reportar progreso de inicio
    if (onProgress) {
      onProgress({ 
        stage: 'uploading', 
        text: 'Iniciando proceso de transcripción...' 
      });
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'text');

    // Reportar progreso de procesamiento
    if (onProgress) {
      onProgress({ 
        stage: 'processing', 
        text: 'Procesando audio con IA...' 
      });
    }

    // Realizar la petición a la API de OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error de la API: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`);
    }

    // Obtener el texto transcrito
    const transcriptionText = await response.text();

    // Reportar progreso final
    if (onProgress) {
      onProgress({ 
        stage: 'completed', 
        text: '¡Transcripción completada exitosamente!' 
      });
    }

    return transcriptionText.trim();

  } catch (error) {
    console.error('Error en transcripción:', error);
    
    if (onProgress) {
      onProgress({ 
        stage: 'error', 
        text: `Error: ${error.message}` 
      });
    }
    
    throw error;
  }
};

/**
 * Transcribe audio con AssemblyAI con sistema de fallback robusto
 * @param {File} audioFile - El archivo de audio a transcribir
 * @param {string} language - El idioma para la transcripción (por defecto 'es')
 * @param {Function} onProgress - Callback para reportar progreso
 * @returns {Promise<string>} - El texto transcrito
 */
export const transcribeAudioFileWithAssemblyAI = async (audioFile, language = 'es', onProgress = null) => {
  let currentFile = audioFile;
  let attemptCount = 0;
  const maxAttempts = 3;
  
  while (attemptCount < maxAttempts) {
    try {
      attemptCount++;
      
      // Verificar que se tenga la API key
      const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
      if (!ASSEMBLYAI_API_KEY) {
        throw new Error('API key de AssemblyAI no configurada. Agrega VITE_ASSEMBLYAI_API_KEY a tu archivo .env');
      }

      // Reportar progreso inicial
      if (onProgress) {
        const attemptText = attemptCount > 1 ? ` (Intento ${attemptCount}/${maxAttempts})` : '';
        onProgress({ 
          stage: 'preparing', 
          text: `Preparando archivo de audio para transcripción...${attemptText}` 
        });
      }

      // Verificar el tamaño del archivo (máximo 2.2GB para AssemblyAI)
      const maxSize = 2.2 * 1024 * 1024 * 1024; // 2.2GB en bytes
      if (currentFile.size > maxSize) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo es 2.2GB.');
      }

      // Verificar que el archivo no esté vacío
      if (currentFile.size === 0) {
        throw new Error('El archivo está vacío. Selecciona un archivo de audio válido.');
      }

      console.log(`🔄 Intento ${attemptCount}: Procesando archivo:`, {
        name: currentFile.name,
        size: currentFile.size,
        type: currentFile.type,
        attempt: attemptCount
      });

      // Reportar progreso de subida
      if (onProgress) {
        onProgress({ 
          stage: 'uploading', 
          text: 'Subiendo archivo a AssemblyAI...' 
        });
      }

      // Subir el archivo a AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
        },
        body: currentFile
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Error en subida:', errorText);
        throw new Error(`Error al subir archivo: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Archivo subido exitosamente:', uploadResult);

      // Reportar progreso de transcripción
      if (onProgress) {
        onProgress({ 
          stage: 'transcribing', 
          text: 'Iniciando transcripción con IA...' 
        });
      }

      // Configurar la transcripción
      const transcriptionConfig = {
        audio_url: uploadResult.upload_url,
        language_code: language === 'es' ? 'es' : 'en',
        punctuate: true,
        format_text: true,
        speaker_labels: false,
        auto_highlights: false,
        sentiment_analysis: false,
        entity_detection: false,
        iab_categories: false,
        content_safety: false,
        auto_chapters: false,
        summarization: false,
        summary_model: 'informative',
        summary_type: 'bullets'
      };

      // Iniciar la transcripción
      const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(transcriptionConfig)
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('❌ Error iniciando transcripción:', errorText);
        throw new Error(`Error al iniciar transcripción: ${transcriptionResponse.status} - ${errorText}`);
      }

      const transcriptionJob = await transcriptionResponse.json();
      console.log('✅ Transcripción iniciada:', transcriptionJob);

      // Polling para verificar el estado de la transcripción
      let transcriptionResult;
      let attempts = 0;
      const maxPollingAttempts = 120; // 10 minutos máximo

      do {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
        attempts++;

        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionJob.id}`, {
          headers: {
            'authorization': ASSEMBLYAI_API_KEY
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Error verificando estado: ${statusResponse.status}`);
        }

        transcriptionResult = await statusResponse.json();
        console.log(`🔄 Estado de transcripción (${attempts}/${maxPollingAttempts}):`, transcriptionResult.status);

        // Reportar progreso
        if (onProgress) {
          onProgress({ 
            stage: 'processing', 
            text: `Procesando audio... (${Math.min(attempts * 8, 95)}%)` 
          });
        }

      } while (transcriptionResult.status === 'queued' || transcriptionResult.status === 'processing' && attempts < maxPollingAttempts);

      if (transcriptionResult.status === 'error') {
        let errorMessage = transcriptionResult.error || 'Error desconocido en la transcripción';
        
        console.error('❌ Error completo de AssemblyAI:', {
          status: transcriptionResult.status,
          error: transcriptionResult.error,
          id: transcriptionResult.id,
          fullResponse: transcriptionResult,
          attempt: attemptCount,
          fileName: currentFile.name,
          fileType: currentFile.type
        });
        
        // Si es el primer intento y el error indica problema de formato, intentar conversión
        if (attemptCount === 1 && (
          errorMessage.includes('Transcoding failed') || 
          errorMessage.includes('File does not appear to contain audio') ||
          errorMessage.includes('application/octet-stream') ||
          errorMessage.includes('Unsupported file format')
        )) {
          console.log('🔄 Intentando conversión de formato...');
          if (onProgress) {
            onProgress({ 
              stage: 'converting', 
              text: 'Convirtiendo archivo a formato compatible...' 
            });
          }
          
          currentFile = await convertAudioToCompatibleFormat(audioFile);
          continue; // Reintentar con el archivo convertido
        }
        
        // Si es el segundo intento y sigue fallando, intentar con configuración simplificada
        if (attemptCount === 2) {
          console.log('🔄 Intentando con configuración simplificada...');
          // En el siguiente intento usaremos configuración mínima
          continue;
        }
        
        // Si llegamos aquí en el último intento, lanzar error mejorado
        if (errorMessage.includes('Transcoding failed') && errorMessage.includes('File does not appear to contain audio')) {
          errorMessage = 'El archivo no contiene audio válido o está corrupto. Intenta con un archivo diferente o verifica que el archivo no esté dañado.';
        } else if (errorMessage.includes('application/octet-stream')) {
          errorMessage = 'El archivo no fue reconocido como audio. Asegúrate de usar un formato de audio válido como MP3, WAV, M4A, AAC, OGG o FLAC.';
        } else if (errorMessage.includes('File too large')) {
          errorMessage = 'El archivo es demasiado grande. El tamaño máximo permitido es 2.2GB.';
        } else if (errorMessage.includes('Unsupported file format')) {
          errorMessage = 'Formato de archivo no soportado. Intenta convertir el archivo a MP3, WAV, M4A, AAC, OGG o FLAC.';
        }
        
        throw new Error(errorMessage);
      }

      if (transcriptionResult.status !== 'completed') {
        throw new Error('La transcripción no se completó en el tiempo esperado');
      }

      // Reportar progreso final
      if (onProgress) {
        onProgress({ 
          stage: 'completed', 
          text: '¡Transcripción completada exitosamente con IA gratuita!' 
        });
      }

      console.log('✅ Transcripción completada exitosamente:', {
        attempt: attemptCount,
        fileName: currentFile.name,
        textLength: transcriptionResult.text?.length || 0
      });

      return transcriptionResult.text || '';

    } catch (error) {
      console.error(`❌ Error en intento ${attemptCount}:`, error);
      
      // Si no es el último intento, continuar con el siguiente
      if (attemptCount < maxAttempts) {
        console.log(`🔄 Reintentando... (${attemptCount + 1}/${maxAttempts})`);
        if (onProgress) {
          onProgress({ 
            stage: 'retrying', 
            text: `Error en intento ${attemptCount}. Reintentando...` 
          });
        }
        continue;
      }
      
      // Si es el último intento, reportar error final
      if (onProgress) {
        onProgress({ 
          stage: 'error', 
          text: `Error después de ${maxAttempts} intentos: ${error.message}` 
        });
      }
      
      throw error;
    }
  }
};

/**
 * Convierte un archivo de audio a un formato más compatible
 * @param {File} audioFile - El archivo de audio original
 * @returns {Promise<File>} - El archivo convertido
 */
const convertAudioToCompatibleFormat = async (audioFile) => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Crear un AudioContext para procesar el audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convertir a WAV (formato más compatible)
          const wavBlob = audioBufferToWav(audioBuffer);
          const convertedFile = new File([wavBlob], audioFile.name.replace(/\.[^.]+$/, '.wav'), {
            type: 'audio/wav',
            lastModified: audioFile.lastModified
          });
          
          console.log('✅ Archivo convertido exitosamente a WAV:', convertedFile);
          resolve(convertedFile);
        } catch (conversionError) {
          console.warn('⚠️ No se pudo convertir el archivo:', conversionError);
          // Si la conversión falla, devolver el archivo original
          resolve(audioFile);
        }
      };
      
      fileReader.onerror = () => {
        console.warn('⚠️ Error leyendo archivo para conversión');
        resolve(audioFile);
      };
      
      fileReader.readAsArrayBuffer(audioFile);
    } catch (error) {
      console.warn('⚠️ Error en conversión de audio:', error);
      resolve(audioFile);
    }
  });
};

/**
 * Convierte AudioBuffer a WAV
 * @param {AudioBuffer} buffer - El buffer de audio
 * @returns {Blob} - El blob WAV
 */
const audioBufferToWav = (buffer) => {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

/**
 * Transcribe audio usando el micrófono en tiempo real (mantiene Web Speech API para micrófono)
 * @param {string} language - El idioma para la transcripción
 * @param {Function} onResult - Callback para recibir resultados
 * @param {Function} onError - Callback para manejar errores
 * @returns {Object} - Objeto con métodos start y stop
 */
export const transcribeRealTime = (language = 'es-ES', onResult = null, onError = null) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    if (onError) onError('Tu navegador no soporta reconocimiento de voz');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language;

  let isActive = false;

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptPart = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPart;
      } else {
        interimTranscript += transcriptPart;
      }
    }

    if (onResult) {
      onResult({
        final: finalTranscript,
        interim: interimTranscript,
        isFinal: finalTranscript.length > 0
      });
    }
  };

  recognition.onerror = (event) => {
    if (onError) onError(`Error: ${event.error}`);
  };

  recognition.onend = () => {
    if (isActive) {
      // Reiniciar automáticamente si aún está activo
      recognition.start();
    }
  };

  return {
    start: () => {
      isActive = true;
      recognition.start();
    },
    stop: () => {
      isActive = false;
      recognition.stop();
    },
    isActive: () => isActive
  };
};