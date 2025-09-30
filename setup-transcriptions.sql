-- ========================================
-- SCRIPT PARA CONFIGURAR TRANSCRIPCIONES
-- Soluciona: "Could not find the table 'public.transcriptions'"
-- ========================================

-- 1. Crear tabla de transcripciones
CREATE TABLE IF NOT EXISTS public.transcriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  language TEXT DEFAULT 'es-ES',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Información del archivo
  storage_path TEXT,
  original_filename TEXT,
  file_size BIGINT,
  file_type TEXT,
  
  -- Metadatos de transcripción
  confidence DECIMAL(3,2),
  processing_time INTEGER,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS en transcriptions
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para transcriptions
CREATE POLICY "Users can view their own transcriptions" ON public.transcriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transcriptions" ON public.transcriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions" ON public.transcriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions" ON public.transcriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id_status ON public.transcriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON public.transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON public.transcriptions(status);

-- 5. Trigger para updated_at en transcriptions
CREATE TRIGGER handle_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Crear bucket para archivos de audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transcriptions',
  'transcriptions',
  false, -- Bucket privado para seguridad
  104857600, -- 100MB límite de archivo
  ARRAY[
    'audio/mpeg',
    'audio/mp3', 
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/m4a',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/x-flac',
    'audio/wma',
    'audio/amr',
    'audio/3gpp',
    'audio/x-ms-wma',
    'video/mpeg',
    'video/mp4',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/mp3', 
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/m4a',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/x-flac',
    'audio/wma',
    'audio/amr',
    'audio/3gpp',
    'audio/x-ms-wma',
    'video/mpeg',
    'video/mp4',
    'application/octet-stream'
  ];

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar que la tabla transcriptions se creó
SELECT 'transcriptions table created' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'transcriptions'
);

-- Verificar que las políticas se crearon
SELECT COUNT(*) as transcriptions_policies_count 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'transcriptions';

-- Verificar que el bucket se creó
SELECT 'transcriptions bucket created' as status
WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'transcriptions'
);

-- Mostrar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'transcriptions'
ORDER BY ordinal_position;