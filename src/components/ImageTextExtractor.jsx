import React, { useState, useRef } from 'react';
import { extractTextFromImage, generateTextSummary } from '../services/imageTextExtractionService';

const ImageTextExtractor = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [textSummary, setTextSummary] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ status: '', progress: 0, details: '' });
  const [summaryProgress, setSummaryProgress] = useState({ status: '', progress: 0, details: '' });
  const [extractionResults, setExtractionResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Limpiar resultados anteriores
      setExtractedText('');
      setTextSummary('');
      setExtractionResults(null);
    }
  };

  const handleExtractText = async () => {
    if (!selectedImage) return;
    
    setIsExtracting(true);
    setExtractionProgress({ status: 'Iniciando...', progress: 0, details: '' });
    
    try {
      const result = await extractTextFromImage(selectedImage, setExtractionProgress);
      
      if (result.success) {
        setExtractedText(result.text);
        setExtractionResults({
          confidence: result.confidence,
          wordCount: result.text.split(/\\s+/).length,
          charCount: result.text.length
        });
      } else {
        setExtractionProgress({ 
          status: 'Error en la extracción', 
          progress: 0, 
          details: result.error || 'Error desconocido' 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setExtractionProgress({ 
        status: 'Error', 
        progress: 0, 
        details: error.message 
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!extractedText.trim()) return;
    
    setIsGeneratingSummary(true);
    setSummaryProgress({ status: 'Iniciando...', progress: 0, details: '' });
    
    try {
      const result = await generateTextSummary(extractedText, setSummaryProgress);
      
      if (result.success) {
        setTextSummary(result.summary);
      } else {
        setSummaryProgress({ 
          status: 'Error en el resumen', 
          progress: 0, 
          details: result.error || 'Error desconocido' 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setSummaryProgress({ 
        status: 'Error', 
        progress: 0, 
        details: error.message 
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(textSummary);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText('');
    setTextSummary('');
    setExtractionResults(null);
    setExtractionProgress({ status: '', progress: 0, details: '' });
    setSummaryProgress({ status: '', progress: 0, details: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Extractor de Texto de Imágenes
        </h1>
        <p className="text-gray-600">
          Sube una imagen y extrae el texto usando OCR avanzado
        </p>
      </div>

      {/* Área de carga de imagen */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="space-y-4">
              <div className="text-4xl text-gray-400">📷</div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Haz clic para seleccionar una imagen
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, JPEG hasta 10MB
                </p>
              </div>
            </div>
          </label>
        </div>
        
        {selectedImage && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Archivo: {selectedImage.name}
            </span>
            <button
              onClick={handleReset}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Preview de imagen */}
      {imagePreview && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Vista previa de la imagen</h3>
          <div className="flex justify-center">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-96 object-contain border rounded-lg"
            />
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={handleExtractText}
              disabled={isExtracting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtracting ? 'Extrayendo...' : 'Extraer Texto'}
            </button>
          </div>
        </div>
      )}

      {/* Progreso de extracción */}
      {isExtracting && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Progreso de Extracción</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{extractionProgress.status}</span>
              <span>{Math.round(extractionProgress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${extractionProgress.progress}%` }}
              ></div>
            </div>
            {extractionProgress.details && (
              <p className="text-xs text-gray-600">{extractionProgress.details}</p>
            )}
          </div>
        </div>
      )}

      {/* Resultados de extracción */}
      {extractedText && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Texto Extraído</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyText}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Copiar
              </button>
              <button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingSummary ? 'Generando...' : 'Generar Resumen'}
              </button>
            </div>
          </div>
          
          {extractionResults && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Confianza:</span>
                  <span className="ml-2 text-blue-600">{Math.round(extractionResults.confidence)}%</span>
                </div>
                <div>
                  <span className="font-medium">Palabras:</span>
                  <span className="ml-2">{extractionResults.wordCount}</span>
                </div>
                <div>
                  <span className="font-medium">Caracteres:</span>
                  <span className="ml-2">{extractionResults.charCount}</span>
                </div>
              </div>
            </div>
          )}
          
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="El texto extraído aparecerá aquí..."
          />
        </div>
      )}

      {/* Progreso de resumen */}
      {isGeneratingSummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Generando Resumen</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{summaryProgress.status}</span>
              <span>{Math.round(summaryProgress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${summaryProgress.progress}%` }}
              ></div>
            </div>
            {summaryProgress.details && (
              <p className="text-xs text-gray-600">{summaryProgress.details}</p>
            )}
          </div>
        </div>
      )}

      {/* Resumen generado */}
      {textSummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Resumen del Texto</h3>
            <button
              onClick={handleCopySummary}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Copiar
            </button>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-gray-800 leading-relaxed">{textSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTextExtractor;