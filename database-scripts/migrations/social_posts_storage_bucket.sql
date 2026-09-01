-- Migración: Bucket de Storage para imágenes de posts de redes sociales
-- Fecha: 2026-09-01
-- Propósito: Las imágenes generadas en el admin (SocialGenerator/ImageGenerator) se suben
-- aquí para obtener una URL pública, requerida por la API de Buffer para adjuntar imagen
-- a un post (Buffer solo acepta URL, no archivo binario).

-- 1. Crear bucket público (las imágenes de marketing no son sensibles, deben ser accesibles por Buffer)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('social-posts', 'social-posts', true, 5242880, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg'];

-- 2. Política: cualquiera puede LEER (necesario para que Buffer pueda descargar la imagen por URL)
DROP POLICY IF EXISTS "Public read access for social-posts" ON storage.objects;
CREATE POLICY "Public read access for social-posts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'social-posts');

-- 3. Política: solo administradores pueden SUBIR imágenes
DROP POLICY IF EXISTS "Admins can upload social-posts" ON storage.objects;
CREATE POLICY "Admins can upload social-posts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-posts'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Política: solo administradores pueden BORRAR (limpieza de imágenes viejas)
DROP POLICY IF EXISTS "Admins can delete social-posts" ON storage.objects;
CREATE POLICY "Admins can delete social-posts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'social-posts'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Bucket "social-posts" creado/actualizado (público, solo admins pueden subir/borrar)';
END $$;
