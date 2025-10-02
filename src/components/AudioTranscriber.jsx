import { useState, useRef, useEffect } from 'react'

const AudioTranscriber = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Verificar si el navegador soporta Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.')
      return
    }

    // Crear instancia de reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    const recognition = recognitionRef.current

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-ES' // Español

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart
        } else {
          interimTranscript += transcriptPart
        }
      }

      setTranscript(prev => prev + finalTranscript)
    }

    recognition.onerror = (event) => {
      setError('Error en el reconocimiento de voz: ' + event.error)
      setIsListening(false)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (isRecording) {
        // Reiniciar automáticamente si aún estamos grabando
        recognition.start()
      }
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [isRecording])

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setTranscript('')
      setError('')
      setIsRecording(true)
      recognitionRef.current.start()
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      setIsRecording(false)
      recognitionRef.current.stop()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript)
      .then(() => {
        alert('Texto copiado al portapapeles')
      })
      .catch(() => {
        alert('Error al copiar el texto')
      })
  }

  if (error && error.includes('no soporta')) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <p className="text-gray-600">
          Para usar esta función, necesitas un navegador compatible como Google Chrome o Microsoft Edge.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
              isRecording
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
          </button>
          
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
              !isRecording
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Detener
          </button>
        </div>

        {isListening && (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Escuchando...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Transcripción:</h3>
          <div className="space-x-2">
            <button
              onClick={copyToClipboard}
              disabled={!transcript}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
            >
              Copiar
            </button>
            <button
              onClick={clearTranscript}
              disabled={!transcript}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
            >
              Limpiar
            </button>
          </div>
        </div>
        
        <div className="min-h-[200px] p-4 border border-gray-300 rounded-lg bg-gray-50">
          {transcript ? (
            <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
          ) : (
            <p className="text-gray-500 italic">
              La transcripción aparecerá aquí cuando comiences a hablar...
            </p>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Instrucciones:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Haz clic en "Iniciar Grabación" para comenzar</li>
          <li>Habla claramente hacia el micrófono</li>
          <li>La transcripción aparecerá en tiempo real</li>
          <li>Haz clic en "Detener" cuando termines</li>
          <li>Puedes copiar o limpiar el texto transcrito</li>
        </ul>
      </div>
    </div>
  )
}

export default AudioTranscriber
