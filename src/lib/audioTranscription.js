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
 * Transcribe un archivo de audio a texto usando AssemblyAI (GRATUITO - 416 horas por mes)
 * @param {File} audioFile - El archivo de audio a transcribir
 * @param {string} language - El idioma para la transcripción (por defecto 'es')
 * @param {Function} onProgress - Callback para reportar progreso
 * @returns {Promise<string>} - El texto transcrito
 */
export const transcribeAudioFileWithAssemblyAI = async (audioFile, language = 'es', onProgress = null) => {
  try {
    // Verificar que se tenga la API key
    const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('API key de AssemblyAI no configurada. Agrega VITE_ASSEMBLYAI_API_KEY a tu archivo .env');
    }

    // Reportar progreso inicial
    if (onProgress) {
      onProgress({ 
        stage: 'preparing', 
        text: 'Preparando archivo de audio para transcripción...' 
      });
    }

    // Verificar el tamaño del archivo (máximo 2.2GB para AssemblyAI)
    const maxSize = 2.2 * 1024 * 1024 * 1024; // 2.2GB en bytes
    if (audioFile.size > maxSize) {
      throw new Error('El archivo es demasiado grande. El tamaño máximo es 2.2GB.');
    }

    // Verificar que el archivo tenga una extensión de audio válida - AssemblyAI soporta la mayoría de formatos
    const validExtensions = [
      // Formatos de audio comunes
      '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac', '.wma', '.amr', '.3gp', '.mpeg',
      // Formatos adicionales soportados por AssemblyAI
      '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.ogv', '.m4v', '.3gpp',
      '.aiff', '.au', '.ra', '.caf', '.opus', '.ac3', '.dts', '.mp2', '.mpa', '.mpc',
      // Formatos menos comunes pero soportados
      '.ape', '.wv', '.tta', '.tak', '.spx', '.gsm', '.voc', '.snd', '.aif', '.aifc'
    ];
    const fileExtension = audioFile.name.toLowerCase().match(/\.[^.]+$/);
    if (!fileExtension || !validExtensions.includes(fileExtension[0])) {
      console.warn('⚠️ Extensión no reconocida, pero intentando con AssemblyAI:', fileExtension?.[0] || 'sin extensión');
      // No lanzar error - dejar que AssemblyAI decida si puede procesarlo
    }

    // Verificar que el archivo no esté vacío
    if (audioFile.size === 0) {
      throw new Error('El archivo está vacío. Selecciona un archivo de audio válido.');
    }

    // Reportar progreso de subida
    if (onProgress) {
      onProgress({ 
        stage: 'uploading', 
        text: 'Subiendo archivo a AssemblyAI...' 
      });
    }

    // Paso 1: Subir el archivo a AssemblyAI
    console.log('📁 Información del archivo:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: new Date(audioFile.lastModified).toISOString()
    });

    const uploadFormData = new FormData();
    uploadFormData.append('file', audioFile);

    console.log('🚀 Subiendo archivo a AssemblyAI...');
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
      },
      body: uploadFormData
    });

    console.log('📤 Respuesta de subida:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      headers: Object.fromEntries(uploadResponse.headers.entries())
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('❌ Error en subida:', errorData);
      throw new Error(`Error al subir archivo: ${uploadResponse.status} - ${errorData.error || 'Error desconocido'}`);
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    console.log('✅ Archivo subido exitosamente. URL:', audioUrl);

    // Reportar progreso de procesamiento
    if (onProgress) {
      onProgress({ 
        stage: 'processing', 
        text: 'Procesando audio con IA gratuita...' 
      });
    }

    // Paso 2: Crear la transcripción
    const transcriptConfig = {
      audio_url: audioUrl,
      language_code: language === 'es' ? 'es' : 'en', // AssemblyAI usa códigos diferentes
      punctuate: true,
      format_text: true
    };

    console.log('⚙️ Configuración de transcripción:', transcriptConfig);

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptConfig)
    });

    if (!transcriptResponse.ok) {
      const errorData = await transcriptResponse.json().catch(() => ({}));
      throw new Error(`Error al crear transcripción: ${transcriptResponse.status} - ${errorData.error || 'Error desconocido'}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    // Paso 3: Esperar a que se complete la transcripción
    let transcriptionResult;
    let attempts = 0;
    const maxAttempts = 60; // Máximo 5 minutos de espera

    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Error al verificar estado: ${statusResponse.status}`);
      }

      transcriptionResult = await statusResponse.json();
      attempts++;

      if (onProgress && transcriptionResult.status === 'processing') {
        onProgress({ 
          stage: 'processing', 
          text: `Procesando audio... (${Math.min(attempts * 8, 95)}%)` 
        });
      }

    } while (transcriptionResult.status === 'queued' || transcriptionResult.status === 'processing' && attempts < maxAttempts);

    if (transcriptionResult.status === 'error') {
      let errorMessage = transcriptionResult.error || 'Error desconocido en la transcripción';
      
      console.error('❌ Error completo de AssemblyAI:', {
        status: transcriptionResult.status,
        error: transcriptionResult.error,
        id: transcriptionResult.id,
        fullResponse: transcriptionResult
      });
      
      // Mejorar mensajes de error específicos
      if (errorMessage.includes('Transcoding failed') && errorMessage.includes('File does not appear to contain audio')) {
        console.error('🔍 Error específico: Archivo no contiene audio válido según AssemblyAI');
        errorMessage = 'El archivo no contiene audio válido. Verifica que sea un archivo de audio real y no esté corrupto. AssemblyAI soporta la mayoría de formatos comunes.';
      } else if (errorMessage.includes('application/octet-stream')) {
        errorMessage = 'El archivo no fue reconocido como audio. Asegúrate de usar un formato de audio válido. AssemblyAI soporta la mayoría de formatos comunes.';
      } else if (errorMessage.includes('File too large')) {
        errorMessage = 'El archivo es demasiado grande. El tamaño máximo permitido es 2.2GB.';
      } else if (errorMessage.includes('Unsupported file format')) {
        errorMessage = 'Formato de archivo no soportado por AssemblyAI. Intenta con un formato más común como MP3, WAV, M4A, AAC, OGG, FLAC.';
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

    return transcriptionResult.text || '';

  } catch (error) {
    console.error('Error en transcripción con AssemblyAI:', error);
    
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