import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import TranscriptionProgress from './TranscriptionProgress';

const NewTranscription = () => {
  const { user } = useAuth();
  const [transcriptionData, setTranscriptionData] = useState({
    title: '',
    language: 'es',
    audioFile: null
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transcriptionMethod, setTranscriptionMethod] = useState('upload'); // 'upload' or 'record'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showProgressScreen, setShowProgressScreen] = useState(false);
  const [currentTranscriptionId, setCurrentTranscriptionId] = useState(null);
  const [bypassValidation, setBypassValidation] = useState(false);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Formatos de audio soportados con sus tipos MIME
  const supportedFormats = {
    'audio/mpeg': ['.mp3', '.mpeg'],
    'audio/mp3': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/wave': ['.wav'],
    'audio/x-wav': ['.wav'],
    'audio/m4a': ['.m4a'],
    'audio/mp4': ['.m4a', '.mp4'],
    'audio/aac': ['.aac'],
    'audio/ogg': ['.ogg'],
    'audio/webm': ['.webm'],
    'audio/flac': ['.flac'],
    'audio/x-flac': ['.flac'],
    'audio/wma': ['.wma'],
    'audio/amr': ['.amr'],
    'audio/3gpp': ['.3gp'],
    'audio/x-ms-wma': ['.wma'],
    // Tipos MIME adicionales que pueden ser detectados por el navegador
    'video/mpeg': ['.mp3', '.mpeg'], // Algunos archivos MP3 son detectados como video/mpeg
    'video/mp4': ['.m4a', '.mp4'], // Algunos archivos M4A son detectados como video/mp4
    'application/octet-stream': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac', '.wma', '.amr', '.3gp', '.mpeg']
  };

  const maxFileSize = 100 * 1024 * 1024; // 100MB

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTranscriptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para detectar el tipo de archivo por su contenido (magic numbers)
  const detectFileTypeByContent = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result);
        let header = '';
        for (let i = 0; i < Math.min(arr.length, 16); i++) {
          header += arr[i].toString(16).padStart(2, '0');
        }
        
        console.log('🔍 Magic numbers detectados:', header, 'para archivo:', file.name);
        
        // Magic numbers expandidos para diferentes formatos de audio
        const audioSignatures = {
          // MP3 variants
          'fffb': 'mp3',      // MP3 Layer III
          'fff3': 'mp3',      // MP3 Layer III
          'fff2': 'mp3',      // MP3 Layer II
          'ffe3': 'mp3',      // MP3 Layer III
          'ffe2': 'mp3',      // MP3 Layer II
          '494433': 'mp3',    // MP3 con ID3v2
          
          // WAV/RIFF
          '52494646': 'wav',  // WAV (RIFF)
          '57415645': 'wav',  // WAV (WAVE)
          
          // MP4/M4A/AAC
          '66747970': 'm4a',  // M4A/MP4 (ftyp)
          '00000018667479704d344120': 'm4a', // M4A específico
          '00000020667479704d344120': 'm4a', // M4A específico
          
          // OGG variants
          '4f676753': 'ogg',  // OGG
          
          // FLAC
          '664c6143': 'flac', // FLAC
          
          // AMR
          '2321414d52': 'amr', // AMR
          
          // AIFF
          '464f524d': 'aiff', // AIFF (FORM)
          
          // WMA/ASF
          '3026b2758e66cf11': 'wma', // WMA/ASF
          
          // WebM
          '1a45dfa3': 'webm', // WebM/MKV
          
          // 3GP
          '66747970336770': '3gp', // 3GP
          
          // Additional MP4 variants
          '667479704d534e56': 'mp4', // MP4 MSNV
          '66747970697361': 'mp4',   // MP4 isom
          '667479706d703432': 'mp4', // MP4 mp42
          '667479706d703431': 'mp4', // MP4 mp41
          
          // AAC
          'fff1': 'aac',      // AAC ADTS
          'fff9': 'aac',      // AAC ADTS
        };
        
        let detectedType = null;
        for (const [signature, type] of Object.entries(audioSignatures)) {
          if (header.toLowerCase().startsWith(signature.toLowerCase())) {
            detectedType = type;
            console.log('✅ Tipo detectado por magic numbers:', type);
            break;
          }
        }
        
        if (!detectedType) {
          console.log('⚠️ No se detectó tipo por magic numbers para:', file.name);
        }
        
        resolve(detectedType);
      };
      reader.readAsArrayBuffer(file.slice(0, 16));
    });
  };

  // Función para validar archivos de audio
  const validateAudioFile = async (file) => {
    console.log('🔍 Validando archivo:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Validar tamaño primero
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo ${Math.round(maxFileSize / (1024 * 1024))}MB.`
      };
    }

    // Validar que no esté vacío
    if (file.size === 0) {
      return {
        valid: false,
        error: 'El archivo está vacío.'
      };
    }

    // Validar por extensión - AssemblyAI soporta la mayoría de formatos comunes
    const fileExtension = file.name.toLowerCase().match(/\.([^.]+)$/);
    const supportedAudioFormats = [
      // Formatos de audio comunes
      'mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac', 'wma', 'amr', '3gp', 'mpeg',
      // Formatos adicionales soportados por AssemblyAI
      'mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'ogv', 'm4v', '3gpp',
      'aiff', 'au', 'ra', 'caf', 'opus', 'ac3', 'dts', 'mp2', 'mpa', 'mpc',
      // Formatos menos comunes pero soportados
      'ape', 'wv', 'tta', 'tak', 'spx', 'gsm', 'voc', 'snd', 'aif', 'aifc'
    ];
    
    const hasValidExtension = fileExtension && supportedAudioFormats.includes(fileExtension[1]);
    
    console.log('📁 Extensión del archivo:', fileExtension ? fileExtension[1] : 'sin extensión');
    console.log('✅ Extensión válida:', hasValidExtension);
    
    if (!hasValidExtension) {
      console.log('❌ Extensión no soportada:', fileExtension ? fileExtension[1] : 'sin extensión');
      return {
        valid: false,
        error: 'Formato de archivo no reconocido. AssemblyAI soporta la mayoría de formatos de audio y video comunes. Si tu archivo es de audio, inténtalo de todas formas.'
      };
    }

    // Validar tipo MIME si está disponible
    const validMimeTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/aac', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm',
      'audio/flac', 'audio/x-flac', 'audio/wma', 'audio/x-ms-wma',
      'audio/amr', 'audio/3gpp', 'audio/aiff', 'audio/x-aiff',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/octet-stream' // Permitir archivos binarios genéricos
    ];
    
    console.log('🎵 Tipo MIME:', file.type);
    
    if (file.type && !validMimeTypes.includes(file.type)) {
      console.log('⚠️ Tipo MIME no reconocido, pero continuando con validación por contenido');
    }

    // Validar por contenido (magic numbers) - mejorado
    try {
      const detectedType = await detectFileTypeByContent(file);
      
      if (!detectedType) {
        console.log('⚠️ No se pudo detectar el tipo por magic numbers, pero el archivo tiene extensión válida');
        // Si no se puede detectar por magic numbers pero tiene extensión válida, 
        // permitir que AssemblyAI lo procese
        if (hasValidExtension) {
          console.log('✅ Archivo aceptado por extensión válida a pesar de magic numbers no detectados');
          return { valid: true };
        }
      } else {
        console.log('✅ Archivo validado exitosamente - tipo detectado:', detectedType);
        return { valid: true };
      }
    } catch (error) {
      console.warn('⚠️ Error al verificar el contenido del archivo:', error);
      // Si hay error leyendo el contenido pero la extensión es válida, continuar
      if (hasValidExtension) {
        console.log('✅ Archivo aceptado por extensión válida a pesar del error en magic numbers');
        return { valid: true };
      }
    }

    // Si llegamos aquí, el archivo no pasó ninguna validación
    console.log('❌ Archivo rechazado - no pasó validaciones');
    return {
      valid: false,
      error: 'No se pudo validar el archivo como audio válido. Intenta con un formato más común como MP3, WAV, M4A, AAC.'
    };
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (bypassValidation) {
        // Saltarse toda la validación local
        console.log('🚀 Saltando validación local - archivo aceptado directamente');
        setTranscriptionData(prev => ({
          ...prev,
          audioFile: file
        }));
        setError('');
        return;
      }

      setError('Validando archivo...');
      
      try {
        const validation = await validateAudioFile(file);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        setTranscriptionData(prev => ({
          ...prev,
          audioFile: file
        }));
        setError('');
      } catch (error) {
        setError('Error al validar el archivo: ' + error.message);
      }
    }
  };

  // Funciones para drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (bypassValidation) {
        // Saltarse toda la validación local
        console.log('🚀 Saltando validación local - archivo arrastrado aceptado directamente');
        setTranscriptionData(prev => ({
          ...prev,
          audioFile: file
        }));
        setError('');
        return;
      }

      setError('Validando archivo...');
      
      try {
        const validation = await validateAudioFile(file);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        setTranscriptionData(prev => ({
          ...prev,
          audioFile: file
        }));
        setError('');
      } catch (error) {
        setError('Error al validar el archivo: ' + error.message);
      }
    }
  }, [bypassValidation]);

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startRecording = async () => {
    try {
      // Solicitar permisos de micrófono con configuración de alta calidad
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });

      // Verificar qué tipos MIME están soportados
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = mimeType.includes('webm') ? '.webm' : 
                         mimeType.includes('mp4') ? '.m4a' : '.wav';
        const fileName = `grabacion_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}${extension}`;
        const audioFile = new File([audioBlob], fileName, { type: mimeType });
        
        setTranscriptionData(prev => ({
          ...prev,
          audioFile: audioFile
        }));
        
        // Limpiar el stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        setError('Error durante la grabación: ' + event.error);
        setIsRecording(false);
        clearInterval(recordingIntervalRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      // Iniciar grabación con intervalos de datos cada segundo
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      let errorMessage = 'Error al acceder al micrófono: ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No se encontró ningún micrófono disponible.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'El micrófono está siendo usado por otra aplicación.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para subir archivo a Supabase Storage
  const uploadAudioFile = async (file, transcriptionId) => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${transcriptionId}_${Date.now()}.${fileExtension}`;
    const filePath = `audio/${user.id}/${fileName}`;

    // Simular progreso de subida
    setUploadProgress(10);
    
    const { data, error } = await supabase.storage
      .from('transcriptions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    setUploadProgress(100);

    if (error) {
      // Manejo específico de errores de Storage
      let errorMessage = 'Error al subir archivo';
      
      if (error.message.includes('Bucket not found')) {
        errorMessage = 'El bucket de almacenamiento no está configurado. Por favor, ejecuta el script supabase-storage-setup.sql en tu proyecto de Supabase.';
      } else if (error.message.includes('The resource was not found')) {
        errorMessage = 'Bucket de almacenamiento no encontrado. Verifica la configuración de Supabase Storage.';
      } else if (error.message.includes('Payload too large')) {
        errorMessage = 'El archivo es demasiado grande. El tamaño máximo permitido es 100MB.';
      } else if (error.message.includes('Invalid file type')) {
        errorMessage = 'Tipo de archivo no permitido. Solo se aceptan archivos de audio.';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'No tienes permisos para subir archivos. Verifica las políticas de Storage.';
      } else {
        errorMessage = `Error al subir archivo: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }

    return {
      path: filePath,
      url: data.path
    };
  };

  // Función para procesar la transcripción en segundo plano
  const processTranscriptionInBackground = async (transcriptionId, audioFile) => {
    try {
      // Subir archivo a Supabase Storage
      const uploadResult = await uploadAudioFile(audioFile, transcriptionId);
      
      // Actualizar registro con información del archivo subido
      const { error: updateError } = await supabase
        .from('transcriptions')
        .update({
          status: 'processing',
          storage_path: uploadResult.path,
          original_filename: audioFile.name,
          file_size: audioFile.size,
          file_type: audioFile.type
        })
        .eq('id', transcriptionId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // La transcripción real se maneja en TranscriptionProgress
      // Este proceso solo se encarga de la subida del archivo

    } catch (uploadError) {
      console.error('Error in background processing:', uploadError);
      // Si falla la subida, marcar como error
      await supabase
        .from('transcriptions')
        .update({
          status: 'failed'
        })
        .eq('id', transcriptionId);
    }
  };

  const submitTranscription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      if (!transcriptionData.audioFile) {
        throw new Error('Por favor selecciona un archivo de audio o graba uno.');
      }

      if (!transcriptionData.title.trim()) {
        throw new Error('Por favor ingresa un título para la transcripción.');
      }

      // Crear registro inicial en la base de datos
      const transcriptionRecord = {
        user_id: user.id,
        title: transcriptionData.title.trim(),
        status: 'pending',
        language: transcriptionData.language,
        content: '' // Valor inicial vacío para evitar restricción NOT NULL
      };

      const { data: newTranscription, error: insertError } = await supabase
        .from('transcriptions')
        .insert([transcriptionRecord])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Mostrar pantalla de progreso inmediatamente
      setCurrentTranscriptionId(newTranscription.id);
      setShowProgressScreen(true);
      setLoading(false);

      // Procesar en segundo plano
      processTranscriptionInBackground(newTranscription.id, transcriptionData.audioFile);

    } catch (err) {
      setError('Error al crear la transcripción: ' + err.message);
      setUploadProgress(0);
      setLoading(false);
    }
  };

  // Función para manejar la finalización de la transcripción
  const handleTranscriptionComplete = () => {
    setShowProgressScreen(false);
    setCurrentTranscriptionId(null);
    setSuccess('¡Transcripción completada exitosamente!');
    
    // Limpiar formulario
    setTranscriptionData({
      title: '',
      language: 'es',
      audioFile: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadProgress(0);
  };

  // Función para manejar la cancelación de la transcripción
  const handleTranscriptionCancel = async () => {
    if (currentTranscriptionId) {
      try {
        // Marcar como cancelada en la base de datos
        await supabase
          .from('transcriptions')
          .update({
            status: 'failed'
          })
          .eq('id', currentTranscriptionId);
      } catch (err) {
        console.error('Error canceling transcription:', err);
      }
    }
    
    setShowProgressScreen(false);
    setCurrentTranscriptionId(null);
    setError('Transcripción cancelada por el usuario.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Nueva Transcripción</h2>
        <p className="text-sm sm:text-base text-gray-600">Sube un archivo de audio o graba directamente para transcribir</p>
      </div>

      {/* Method Selection */}
      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          type="button"
          onClick={() => setTranscriptionMethod('upload')}
          className={`px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${
            transcriptionMethod === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📁 Subir Archivo
        </button>
        <button
          type="button"
          onClick={() => setTranscriptionMethod('record')}
          className={`px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${
            transcriptionMethod === 'record'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🎤 Grabar Audio
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
          {success}
        </div>
      )}

      <form onSubmit={submitTranscription} className="space-y-4 sm:space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Título de la Transcripción
          </label>
          <input
            type="text"
            name="title"
            value={transcriptionData.title}
            onChange={handleInputChange}
            placeholder="Ej: Reunión de equipo - 15 de enero"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            required
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Idioma del Audio
          </label>
          <select
            name="language"
            value={transcriptionData.language}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>

        {/* File Upload Method */}
        {transcriptionMethod === 'upload' && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Archivo de Audio
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,.wma,.amr,.3gp,.mpeg"
                className="hidden"
              />
              <div className="space-y-2 sm:space-y-3">
                <div className="text-2xl sm:text-4xl">
                  {isDragOver ? '📥' : '🎵'}
                </div>
                <div className="text-sm sm:text-base">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Seleccionar archivo
                  </button>
                  <span className="text-gray-500 hidden sm:inline"> o arrastra y suelta aquí</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Formatos soportados:</strong></p>
                  <p className="hidden sm:block">MP3, WAV, M4A, AAC, OGG, WEBM, FLAC, WMA, AMR, 3GP, MPEG</p>
                  <p className="sm:hidden">MP3, WAV, M4A, AAC, OGG</p>
                  <p><strong>Tamaño máximo:</strong> {Math.round(maxFileSize / (1024 * 1024))}MB</p>
                </div>
                
                {transcriptionData.audioFile && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-3">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ {transcriptionData.audioFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Tamaño: {formatFileSize(transcriptionData.audioFile.size)} | 
                      Tipo: {transcriptionData.audioFile.type || 'Detectado por extensión'}
                    </p>
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Subiendo... {uploadProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recording Method */}
        {transcriptionMethod === 'record' && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Grabación de Audio
            </label>
            <div className="border border-gray-300 rounded-lg p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
              <div className="text-2xl sm:text-4xl">🎤</div>
              
              {!isRecording && !transcriptionData.audioFile && (
                <div className="space-y-2 sm:space-y-3">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-colors shadow-lg text-sm sm:text-base"
                  >
                    🔴 Iniciar Grabación
                  </button>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Configuración de grabación:</strong></p>
                    <div className="hidden sm:block">
                      <p>• Calidad: Alta (44.1kHz)</p>
                      <p>• Cancelación de eco activada</p>
                      <p>• Supresión de ruido activada</p>
                      <p>• Control automático de ganancia</p>
                    </div>
                    <div className="sm:hidden">
                      <p>• Calidad alta</p>
                      <p>• Cancelación de eco</p>
                    </div>
                  </div>
                </div>
              )}

              {isRecording && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="text-xl sm:text-3xl font-mono text-red-600 bg-red-50 rounded-lg py-2 px-3 sm:px-4 inline-block">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Grabando...</p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base"
                    >
                      ⏹️ Detener
                    </button>
                  </div>
                  
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p>💡 Habla claramente cerca del micrófono</p>
                    <p className="hidden sm:block">🔇 Evita ruidos de fondo</p>
                  </div>
                </div>
              )}

              {transcriptionData.audioFile && transcriptionMethod === 'record' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-3">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ Grabación completada exitosamente
                  </p>
                  <div className="text-xs text-green-600 space-y-1">
                    <p><strong>Archivo:</strong> {transcriptionData.audioFile.name}</p>
                    <p><strong>Tamaño:</strong> {formatFileSize(transcriptionData.audioFile.size)}</p>
                    <p><strong>Duración:</strong> {formatTime(recordingTime)}</p>
                    <p><strong>Formato:</strong> {transcriptionData.audioFile.type}</p>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTranscriptionData(prev => ({ ...prev, audioFile: null }));
                        setRecordingTime(0);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      🔄 Grabar de nuevo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center sm:justify-end">
          <button
            type="submit"
            disabled={loading || !transcriptionData.audioFile || !transcriptionData.title.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            {loading ? 'Procesando...' : 'Crear Transcripción'}
          </button>
        </div>
      </form>


      {/* AI Service Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl">🤖</span>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-green-800">IA Activada</h3>
              <p className="text-xs text-green-700">
                Usando AssemblyAI - Alta precisión y velocidad.
              </p>
            </div>
          </div>
        </div>

      {/* Pantalla de progreso de transcripción */}
      {showProgressScreen && (
        <TranscriptionProgress
          audioFile={transcriptionData.audioFile}
          transcriptionTitle={transcriptionData.title}
          transcriptionId={currentTranscriptionId}
          onComplete={handleTranscriptionComplete}
          onCancel={handleTranscriptionCancel}
        />
      )}
    </div>
  );
};

export default NewTranscription;