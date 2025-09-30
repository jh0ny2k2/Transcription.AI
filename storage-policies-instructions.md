# Configuración de Políticas de Storage para Transcripciones

## ⚠️ IMPORTANTE
Después de ejecutar `setup-transcriptions.sql`, debes configurar estas políticas manualmente desde la interfaz web de Supabase.

## 📍 Ubicación
1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage > Buckets**
3. Busca el bucket **"transcriptions"**
4. Haz clic en el bucket y luego en **"Policies"**

## 🔐 Políticas a Crear

### 1. Política INSERT (Subir archivos)
- **Nombre**: `Allow authenticated users to upload audio files`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
```sql
bucket_id = 'transcriptions' AND auth.uid() IS NOT NULL
```

### 2. Política SELECT (Ver archivos)
- **Nombre**: `Allow authenticated users to view their audio files`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'transcriptions' AND auth.uid() IS NOT NULL
```

### 3. Política UPDATE (Actualizar archivos)
- **Nombre**: `Allow authenticated users to update their audio files`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'transcriptions' AND auth.uid() IS NOT NULL
```

### 4. Política DELETE (Eliminar archivos)
- **Nombre**: `Allow authenticated users to delete their audio files`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'transcriptions' AND auth.uid() IS NOT NULL
```

## ✅ Verificación
Después de crear todas las políticas, deberías ver 4 políticas activas en el bucket "transcriptions".

## 🚀 Siguiente Paso
Una vez configuradas las políticas, prueba subir un archivo de audio en tu aplicación.