import { createWorker } from 'tesseract.js';

// Configuraciones de OCR optimizadas para máxima precisión
const OCR_CORRECTIONS = {
  // Correcciones de caracteres individuales comunes en OCR
  '|': 'l', '1': 'l', '0': 'o', '5': 's', '8': 'B', '6': 'G',
  'rn': 'm', 'cl': 'd', 'ri': 'n', 'vv': 'w', 'VV': 'W',
  'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl',
  
  // Correcciones específicas para español
  'que': 'que', 'con': 'con', 'una': 'una', 'para': 'para',
  'por': 'por', 'como': 'como', 'pero': 'pero', 'todo': 'todo',
  'muy': 'muy', 'sin': 'sin', 'sobre': 'sobre', 'también': 'también',
  'después': 'después', 'tiempo': 'tiempo', 'año': 'año', 'años': 'años',
  'estado': 'estado', 'durante': 'durante', 'gobierno': 'gobierno',
  'país': 'país', 'parte': 'parte', 'general': 'general',
  'lugar': 'lugar', 'caso': 'caso', 'día': 'día', 'grupo': 'grupo',
  'momento': 'momento', 'manera': 'manera', 'vez': 'vez', 'agua': 'agua',
  'historia': 'historia', 'derecho': 'derecho', 'hombre': 'hombre',
  'mundo': 'mundo', 'vida': 'vida', 'días': 'días', 'punto': 'punto',
  'año': 'año', 'trabajo': 'trabajo', 'gobierno': 'gobierno',
  'empresa': 'empresa', 'caso': 'caso', 'niño': 'niño', 'programa': 'programa',
  'pregunta': 'pregunta', 'problema': 'problema', 'servicio': 'servicio'
};

// Función para preprocesar la imagen para máxima calidad OCR
async function preprocessImage(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Escalar la imagen 3x para mejor resolución
      const scaleFactor = 3;
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      
      // Configurar calidad máxima
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Dibujar imagen escalada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Obtener datos de imagen para procesamiento
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convertir a escala de grises con pesos optimizados
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(
          data[i] * 0.299 +     // Red
          data[i + 1] * 0.587 + // Green
          data[i + 2] * 0.114   // Blue
        );
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      
      // Aplicar corrección gamma para mejorar contraste
      const gamma = 1.2;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.pow(data[i] / 255, 1 / gamma) * 255;
        data[i + 1] = Math.pow(data[i + 1] / 255, 1 / gamma) * 255;
        data[i + 2] = Math.pow(data[i + 2] / 255, 1 / gamma) * 255;
      }
      
      // Mejorar contraste
      const contrastFactor = 2.0;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));
      }
      
      // Aplicar umbralización adaptativa
      const threshold = 140;
      for (let i = 0; i < data.length; i += 4) {
        const value = data[i] > threshold ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
      
      // Aplicar filtro de nitidez
      applySharpenFilter(imageData, canvas.width, canvas.height);
      
      // Actualizar canvas con imagen procesada
      ctx.putImageData(imageData, 0, 0);
      
      // Convertir a PNG de máxima calidad
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.src = imageDataUrl;
  });
}

// Función para aplicar filtro de nitidez
function applySharpenFilter(imageData, width, height) {
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  // Kernel de nitidez
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.min(255, Math.max(0, sum));
      }
    }
  }
  
  // Copiar datos procesados de vuelta
  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }
}

// Función para limpiar y corregir texto extraído
function cleanExtractedText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text;
  
  // Aplicar correcciones de OCR
  Object.entries(OCR_CORRECTIONS).forEach(([wrong, correct]) => {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'gi');
    cleaned = cleaned.replace(regex, (match) => {
      // Preservar capitalización original
      if (match === match.toUpperCase()) return correct.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return correct.charAt(0).toUpperCase() + correct.slice(1);
      return correct;
    });
  });
  
  // Corregir secuencias problemáticas
  cleaned = cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Separar palabras pegadas
    .replace(/\\s{2,}/g, ' ') // Múltiples espacios a uno
    .replace(/([.!?])([A-Z])/g, '$1 $2') // Espacio después de puntuación
    .replace(/([a-z])([.!?])/g, '$1$2') // Sin espacio antes de puntuación
    .replace(/\\n\\s*\\n/g, '\\n') // Múltiples saltos de línea
    .replace(/^\\s+|\\s+$/g, '') // Espacios al inicio y final
    .replace(/([a-z])- ([a-z])/g, '$1$2'); // Unir palabras divididas por guión
  
  // Correcciones específicas para español
  cleaned = cleaned
    .replace(/\\bque\\s+no\\b/gi, 'que no')
    .replace(/\\bpor\\s+que\\b/gi, 'por que')
    .replace(/\\bsin\\s+embargo\\b/gi, 'sin embargo')
    .replace(/\\ba\\s+través\\b/gi, 'a través')
    .replace(/\\bde\\s+acuerdo\\b/gi, 'de acuerdo')
    .replace(/\\ben\\s+el\\b/gi, 'en el')
    .replace(/\\bcon\\s+el\\b/gi, 'con el')
    .replace(/\\bpara\\s+el\\b/gi, 'para el');
  
  return cleaned.trim();
}

// Función principal para extraer texto de imagen
export async function extractTextFromImage(imageFile, onProgress) {
  try {
    // Convertir archivo a data URL
    const imageDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(imageFile);
    });
    
    onProgress?.({ 
      status: 'Preparando imagen...', 
      progress: 10,
      details: 'Iniciando procesamiento de imagen'
    });
    
    // Preprocesar imagen para máxima calidad
    const processedImageUrl = await preprocessImage(imageDataUrl);
    
    onProgress?.({ 
      status: 'Imagen optimizada, iniciando OCR...', 
      progress: 20,
      details: 'Imagen escalada y optimizada para OCR'
    });
    
    // Configuraciones PSM ordenadas por efectividad
    const psmModes = [6, 8, 7, 4, 3, 1, 11, 12, 13];
    let bestResult = { text: '', confidence: 0 };
    
    for (let i = 0; i < psmModes.length; i++) {
      const psm = psmModes[i];
      
      onProgress?.({ 
        status: `Analizando con método ${i + 1}/${psmModes.length}...`, 
        progress: 20 + (i * 60 / psmModes.length),
        details: `Usando PSM ${psm} para análisis de texto`
      });
      
      try {
        const worker = await createWorker('spa', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              onProgress?.({ 
                status: `Método ${i + 1}: Reconociendo texto...`, 
                progress: 20 + (i * 60 / psmModes.length) + (m.progress * 60 / psmModes.length),
                details: `PSM ${psm}: ${Math.round(m.progress * 100)}% completado`
              });
            }
          }
        });
        
        // Configuración ultra-optimizada de Tesseract
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          tessedit_ocr_engine_mode: 1, // LSTM engine
          classify_bln_numeric_mode: 1,
          textord_really_old_xheight: 0,
          textord_min_xheight: 6,
          textord_max_xheight: 2000,
          tessedit_enable_dict_correction: 1,
          tessedit_enable_bigram_correction: 1,
          load_system_dawg: 1,
          load_freq_dawg: 1,
          load_unambig_dawg: 1,
          load_punc_dawg: 1,
          load_number_dawg: 1,
          tessedit_char_whitelist: '',
          tessedit_char_blacklist: '',
          preserve_interword_spaces: 1,
          tessedit_do_invert: 0,
          tessedit_good_quality_unrej: 1.1,
          tessedit_use_reject_spaces: 1,
          wordrec_enable_assoc: 1,
          classify_integer_matcher_multiplier: 10,
          language_model_penalty_non_freq_dict_word: 0.1,
          language_model_penalty_non_dict_word: 0.15,
          language_model_penalty_punc: 0.2,
          language_model_penalty_case: 0.05,
          language_model_penalty_script: 0.05,
          language_model_penalty_chartype: 0.3,
          language_model_penalty_spacing: 0.05,
          language_model_penalty_font: 0.00,
          textord_noise_rejwords: 1,
          textord_noise_rejrows: 1,
          textord_noise_debug: 0,
          edges_use_new_outline_complexity: 0,
          edges_debug: 0,
          textord_debug_tabfind: 0,
          tessedit_resegment_from_boxes: 1,
          tessedit_resegment_from_line_boxes: 1,
          tessedit_train_from_boxes: 0,
          tessedit_make_boxes_from_boxes: 0,
          tessedit_train_line_recognizer: 0,
          tessedit_dump_pageseg_images: 0,
          tessedit_do_invert: 0,
          file_type: '.png'
        });
        
        const { data: { text, confidence } } = await worker.recognize(processedImageUrl);
        await worker.terminate();
        
        if (confidence > bestResult.confidence) {
          bestResult = { text, confidence };
        }
        
        onProgress?.({ 
          status: `Método ${i + 1} completado`, 
          progress: 20 + ((i + 1) * 60 / psmModes.length),
          details: `PSM ${psm}: Confianza ${Math.round(confidence)}%`
        });
        
      } catch (error) {
        console.warn(`Error con PSM ${psm}:`, error);
        continue;
      }
    }
    
    onProgress?.({ 
      status: 'Procesando y limpiando texto...', 
      progress: 85,
      details: 'Aplicando correcciones y mejoras al texto'
    });
    
    // Limpiar y corregir el mejor resultado
    const cleanedText = cleanExtractedText(bestResult.text);
    
    onProgress?.({ 
      status: 'Extracción completada', 
      progress: 100,
      details: `Texto extraído con ${Math.round(bestResult.confidence)}% de confianza`
    });
    
    return {
      text: cleanedText,
      confidence: bestResult.confidence,
      success: true
    };
    
  } catch (error) {
    console.error('Error en extracción de texto:', error);
    onProgress?.({ 
      status: 'Error en la extracción', 
      progress: 0,
      details: error.message
    });
    
    return {
      text: '',
      confidence: 0,
      success: false,
      error: error.message
    };
  }
}

// Función para generar resumen de texto usando Hugging Face
export async function generateTextSummary(text, onProgress) {
  try {
    onProgress?.({ 
      status: 'Preparando texto para resumen...', 
      progress: 10,
      details: 'Validando y preparando contenido'
    });
    
    if (!text || text.trim().length < 50) {
      throw new Error('El texto es demasiado corto para generar un resumen');
    }
    
    // Obtener API key del entorno
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
      onProgress?.({ 
        status: 'Usando servicio demo...', 
        progress: 50,
        details: 'API key no configurada, usando resumen básico'
      });
      
      // Resumen básico sin API
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const summary = sentences.slice(0, Math.min(3, Math.ceil(sentences.length * 0.3))).join('. ') + '.';
      
      onProgress?.({ 
        status: 'Resumen generado', 
        progress: 100,
        details: 'Resumen básico completado'
      });
      
      return {
        summary: summary,
        success: true,
        method: 'basic'
      };
    }
    
    onProgress?.({ 
      status: 'Conectando con Hugging Face...', 
      progress: 30,
      details: 'Enviando texto para análisis'
    });
    
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.substring(0, 1000), // Limitar longitud
        parameters: {
          max_length: 150,
          min_length: 30,
          do_sample: false
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error de API: ${response.status}`);
    }
    
    onProgress?.({ 
      status: 'Procesando respuesta...', 
      progress: 80,
      details: 'Generando resumen final'
    });
    
    const result = await response.json();
    
    onProgress?.({ 
      status: 'Resumen completado', 
      progress: 100,
      details: 'Resumen generado exitosamente'
    });
    
    return {
      summary: result[0]?.summary_text || 'No se pudo generar el resumen',
      success: true,
      method: 'huggingface'
    };
    
  } catch (error) {
    console.error('Error generando resumen:', error);
    onProgress?.({ 
      status: 'Error en resumen', 
      progress: 0,
      details: error.message
    });
    
    return {
      summary: '',
      success: false,
      error: error.message
    };
  }
}