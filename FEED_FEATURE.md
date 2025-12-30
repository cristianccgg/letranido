# Feed de Microhistorias - Documentación Técnica

## 📋 Resumen Ejecutivo

Sistema de feed dinámico con prompts semanales para fomentar escritura diaria y engagement en Letranido. Complementa (no reemplaza) el sistema de retos mensuales existente.

**Estado**: 🚧 En desarrollo (branch: `feature/feed-microhistorias`)
**Inicio**: Diciembre 2024
**Objetivo**: Aumentar engagement de 19% a 40%+ en 3 meses

---

## 🎯 Objetivos

### Problemas que resuelve:
1. **Bajo engagement**: Solo 20/105 usuarios activos (~19%)
2. **Espera larga entre retos**: 30 días sin oportunidad de escribir después de votación
3. **Falta de contenido diario**: Usuarios no tienen razón para volver cada día
4. **Nuevos escritores intimidados**: Retos largos (3000 palabras) son barrera de entrada

### Beneficios esperados:
- ✅ Escritura diaria/semanal sin compromisos largos
- ✅ Contenido nuevo constantemente (feed dinámico)
- ✅ Práctica de escritura ágil (50-300 palabras)
- ✅ Mayor retención de usuarios
- ✅ Comunidad más activa
- ✅ Puerta de entrada para nuevos escritores

---

## 🏗️ Arquitectura del Sistema

### Componentes principales:

```
┌─────────────────────────────────────────────┐
│           Landing Page (Público)            │
│  - Preview del feed (3 prompts recientes)   │
│  - CTA: "Ver más historias" → Login         │
│  - Sección ganadores retos (mantener)       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Feed Principal (Logueados)          │
│  - Infinite scroll de prompts               │
│  - Prompt ACTIVO destacado arriba           │
│  - Prompts archivados abajo (read-only)     │
│  - Filtros: Activos / Archivos / Todos      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Prompt Detail Page                 │
│  - Feed de microhistorias (scroll)          │
│  - Formulario publicación (si activo)       │
│  - Sistema comentarios (si activo)          │
│  - Badge estado: ACTIVO / ARCHIVO           │
└─────────────────────────────────────────────┘
```

### Ciclo de vida de un prompt:

```
DRAFT → ACTIVE → ARCHIVED
  ↓       ↓          ↓
Admin  7 días    Read-only
crea   activo   (permanente)
```

---

## 🗄️ Base de Datos

### Tabla: `feed_prompts`

```sql
CREATE TABLE feed_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contenido
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,

  -- Control temporal
  week_number INTEGER NOT NULL, -- Ej: 1, 2, 3...
  year INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Estados
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft': Creado pero no publicado
    -- 'active': Activo para publicación
    -- 'archived': Cerrado, solo lectura

  -- Estadísticas (desnormalizadas para performance)
  stories_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'archived')),
  CONSTRAINT end_after_start CHECK (end_date > start_date),
  UNIQUE(week_number, year)
);
```

### Tabla: `feed_stories` (microhistorias)

```sql
CREATE TABLE feed_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  prompt_id UUID NOT NULL REFERENCES feed_prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contenido
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,

  -- Validación
  word_count INTEGER NOT NULL,
  CONSTRAINT valid_word_count CHECK (word_count >= 50 AND word_count <= 300),

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un usuario solo puede publicar UNA historia por prompt
  UNIQUE(prompt_id, user_id)
);
```

### Tabla: `feed_story_likes`

```sql
CREATE TABLE feed_story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES feed_stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, story_id)
);
```

### Tabla: `feed_story_comments`

```sql
CREATE TABLE feed_story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  story_id UUID NOT NULL REFERENCES feed_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feed_story_comments(id) ON DELETE CASCADE,

  -- Contenido
  content TEXT NOT NULL,

  -- Engagement
  likes_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices críticos:

```sql
-- Queries frecuentes optimizadas
CREATE INDEX idx_feed_prompts_status ON feed_prompts(status, start_date DESC);
CREATE INDEX idx_feed_prompts_week_year ON feed_prompts(year DESC, week_number DESC);
CREATE INDEX idx_feed_stories_prompt ON feed_stories(prompt_id, created_at DESC);
CREATE INDEX idx_feed_stories_user ON feed_stories(user_id, created_at DESC);
CREATE INDEX idx_feed_story_likes_story ON feed_story_likes(story_id);
CREATE INDEX idx_feed_story_likes_user ON feed_story_likes(user_id);
CREATE INDEX idx_feed_story_comments_story ON feed_story_comments(story_id, created_at);
CREATE INDEX idx_feed_story_comments_parent ON feed_story_comments(parent_id);
```

---

## 🔧 Funciones SQL Críticas

### 1. Archivar prompts automáticamente

```sql
CREATE OR REPLACE FUNCTION auto_archive_expired_prompts()
RETURNS void AS $$
BEGIN
  UPDATE feed_prompts
  SET status = 'archived', updated_at = NOW()
  WHERE status = 'active'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger automático (ejecutar vía cron job o edge function diaria)
```

### 2. Toggle like en microhistoria

```sql
CREATE OR REPLACE FUNCTION toggle_feed_story_like(
  p_user_id UUID,
  p_story_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_like_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Verificar si ya existe el like
  SELECT id INTO v_like_id
  FROM feed_story_likes
  WHERE user_id = p_user_id AND story_id = p_story_id;

  IF v_like_id IS NOT NULL THEN
    -- Unlike
    DELETE FROM feed_story_likes WHERE id = v_like_id;

    SELECT likes_count INTO v_new_count
    FROM feed_stories
    WHERE id = p_story_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'unliked',
      'likes_count', v_new_count
    );
  ELSE
    -- Like
    INSERT INTO feed_story_likes (user_id, story_id)
    VALUES (p_user_id, p_story_id)
    RETURNING id INTO v_like_id;

    SELECT likes_count INTO v_new_count
    FROM feed_stories
    WHERE id = p_story_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'liked',
      'like_id', v_like_id,
      'likes_count', v_new_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Actualizar contadores automáticamente

```sql
-- Trigger para sincronizar likes_count en feed_stories
CREATE OR REPLACE FUNCTION update_feed_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_stories
    SET likes_count = likes_count + 1
    WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_stories
    SET likes_count = likes_count - 1
    WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_feed_story_likes_count
  AFTER INSERT OR DELETE ON feed_story_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_story_likes_count();
```

---

## 🎨 UI/UX Especificaciones

### Badges de Estado

```jsx
// Prompt ACTIVO
<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
  <Zap className="w-3.5 h-3.5" />
  ACTIVO
</div>

// Prompt ARCHIVADO
<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
  <Archive className="w-3.5 h-3.5" />
  ARCHIVO
</div>
```

### Tarjeta de Prompt en Feed

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-primary-500 transition-all">
  {/* Header */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Semana {prompt.week_number} • {formatDateRange(prompt.start_date, prompt.end_date)}
      </span>
    </div>
    {statusBadge}
  </div>

  {/* Contenido */}
  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
    {prompt.title}
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
    {prompt.description}
  </p>

  {/* Prompt text destacado */}
  <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-3 mb-4">
    <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
      "{prompt.prompt_text}"
    </p>
  </div>

  {/* Stats + CTA */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span>{prompt.stories_count} historias</span>
      <span>{prompt.total_likes} likes</span>
      <span>{prompt.total_comments} comentarios</span>
    </div>

    {prompt.status === 'active' ? (
      <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg">
        Escribir ahora
      </button>
    ) : (
      <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg">
        Ver historias
      </button>
    )}
  </div>
</div>
```

### Tarjeta de Microhistoria

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
  {/* Author */}
  <div className="flex items-center gap-2 mb-3">
    <Avatar user={story.author} size="sm" />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{story.author.display_name}</span>
        <UserBadges userId={story.author.id} size="xs" />
      </div>
      <span className="text-xs text-gray-500">{formatTimeAgo(story.created_at)}</span>
    </div>
  </div>

  {/* Content */}
  <h4 className="font-bold text-base mb-2">{story.title}</h4>
  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-4">
    {story.content}
  </p>

  {/* Actions */}
  <div className="flex items-center gap-4 text-sm">
    <button className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}>
      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{story.likes_count || ''}</span>
    </button>

    <button className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600">
      <MessageCircle className="w-4 h-4" />
      <span>{story.comments_count || ''}</span>
    </button>

    <span className="ml-auto text-xs text-gray-400">
      {story.word_count} palabras
    </span>
  </div>
</div>
```

### Landing Page Preview (No logueados)

```jsx
<section className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold mb-2">
        ✍️ Escribe cada semana
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Prompts semanales para practicar escritura ágil (50-300 palabras)
      </p>
    </div>

    {/* Preview de 3 prompts recientes */}
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {previewPrompts.map(prompt => (
        <PromptPreviewCard key={prompt.id} prompt={prompt} />
      ))}
    </div>

    {/* CTA */}
    <div className="text-center">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg"
      >
        Ver todas las historias
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  </div>
</section>
```

---

## 🔐 Row Level Security (RLS)

### feed_prompts

```sql
-- Lectura: Todos pueden ver prompts activos y archivados
CREATE POLICY "Anyone can view active/archived prompts"
ON feed_prompts FOR SELECT
USING (status IN ('active', 'archived'));

-- Inserción: Solo admins
CREATE POLICY "Only admins can create prompts"
ON feed_prompts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Actualización: Solo admins
CREATE POLICY "Only admins can update prompts"
ON feed_prompts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

### feed_stories

```sql
-- Lectura: Todos pueden ver historias de prompts activos/archivados
CREATE POLICY "Anyone can view stories from active/archived prompts"
ON feed_stories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = feed_stories.prompt_id
    AND status IN ('active', 'archived')
  )
);

-- Inserción: Usuarios autenticados, solo en prompts activos
CREATE POLICY "Users can create stories in active prompts"
ON feed_stories FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = prompt_id AND status = 'active'
  )
);

-- Actualización: Solo autor, solo en prompts activos
CREATE POLICY "Users can update own stories in active prompts"
ON feed_stories FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = prompt_id AND status = 'active'
  )
);

-- Eliminación: Solo autor, solo en prompts activos
CREATE POLICY "Users can delete own stories in active prompts"
ON feed_stories FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_prompts
    WHERE id = prompt_id AND status = 'active'
  )
);
```

### feed_story_likes

```sql
-- Lectura: Público
CREATE POLICY "Anyone can view likes"
ON feed_story_likes FOR SELECT
USING (true);

-- Inserción: Usuarios autenticados
CREATE POLICY "Authenticated users can like stories"
ON feed_story_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Eliminación: Solo propios likes
CREATE POLICY "Users can unlike own likes"
ON feed_story_likes FOR DELETE
USING (auth.uid() = user_id);
```

### feed_story_comments

```sql
-- Lectura: Público
CREATE POLICY "Anyone can view comments"
ON feed_story_comments FOR SELECT
USING (true);

-- Inserción: Usuarios autenticados, solo en prompts activos
CREATE POLICY "Users can comment in active prompts"
ON feed_story_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM feed_stories fs
    JOIN feed_prompts fp ON fs.prompt_id = fp.id
    WHERE fs.id = story_id AND fp.status = 'active'
  )
);

-- Actualización: Solo autor
CREATE POLICY "Users can update own comments"
ON feed_story_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Eliminación: Autor o admin
CREATE POLICY "Users can delete own comments"
ON feed_story_comments FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

---

## 📱 Componentes React

### Estructura de archivos:

```
src/
├── pages/
│   └── FeedPage.jsx                 # Página principal del feed
├── components/
│   ├── feed/
│   │   ├── PromptCard.jsx          # Tarjeta de prompt en lista
│   │   ├── PromptDetail.jsx        # Vista detallada de prompt
│   │   ├── MicroStoryCard.jsx      # Tarjeta de microhistoria
│   │   ├── MicroStoryForm.jsx      # Formulario para publicar
│   │   ├── FeedFilters.jsx         # Filtros (Activos/Archivos/Todos)
│   │   └── FeedPreview.jsx         # Preview para landing
│   └── admin/
│       └── FeedAdminPanel.jsx      # Panel admin de prompts
├── hooks/
│   ├── useFeedPrompts.js           # Hook para gestión de prompts
│   └── useMicroStories.js          # Hook para microhistorias
└── lib/
    └── feedUtils.js                # Utilidades (validación, formateo)
```

### Hook principal: `useFeedPrompts.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const useFeedPrompts = (filter = 'all') => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('feed_prompts')
        .select('*')
        .order('start_date', { ascending: false });

      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'archived') {
        query = query.eq('status', 'archived');
      } else {
        query = query.in('status', ['active', 'archived']);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPrompts(data || []);
    } catch (err) {
      console.error('Error loading prompts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return {
    prompts,
    loading,
    error,
    refreshPrompts: loadPrompts
  };
};

export default useFeedPrompts;
```

---

## 🚀 Plan de Implementación

### Fase 1: Base de Datos (Sesión 1)
- [x] Crear branch `feature/feed-microhistorias`
- [x] Crear `FEED_FEATURE.md`
- [ ] Crear `database-scripts/migrations/feed_system.sql`
- [ ] Commit inicial: "docs: Add feed system documentation and SQL migration"

### Fase 2: Backend (Sesión 2)
- [ ] Ejecutar migración SQL en Supabase
- [ ] Probar funciones SQL en SQL Editor
- [ ] Agregar funciones en `GlobalAppContext.jsx`:
  - `getFeedPrompts(filter)`
  - `getPromptStories(promptId)`
  - `createFeedStory(promptId, title, content)`
  - `toggleFeedStoryLike(storyId)`
  - `getUserFeedStoryLikes(storyIds[])`
- [ ] Commit: "feat: Add feed backend functions to GlobalAppContext"

### Fase 3: Hooks & Utils (Sesión 3)
- [ ] Crear `useFeedPrompts.js`
- [ ] Crear `useMicroStories.js`
- [ ] Crear `feedUtils.js` (validación word count, formateo)
- [ ] Commit: "feat: Add feed custom hooks and utilities"

### Fase 4: UI Components (Sesión 4-5)
- [ ] Crear `PromptCard.jsx`
- [ ] Crear `MicroStoryCard.jsx`
- [ ] Crear `MicroStoryForm.jsx`
- [ ] Crear `FeedFilters.jsx`
- [ ] Commit: "feat: Add feed UI components"

### Fase 5: Main Pages (Sesión 6-7)
- [ ] Crear `FeedPage.jsx`
- [ ] Crear `PromptDetail.jsx`
- [ ] Agregar rutas en `App.jsx`
- [ ] Commit: "feat: Add feed main pages and routing"

### Fase 6: Landing Preview (Sesión 8)
- [ ] Crear `FeedPreview.jsx`
- [ ] Integrar en `LandingPage.jsx`
- [ ] Commit: "feat: Add feed preview to landing page"

### Fase 7: Admin Panel (Sesión 9)
- [ ] Crear `FeedAdminPanel.jsx`
- [ ] Formulario crear prompts
- [ ] Gestión manual de estado (draft/active/archived)
- [ ] Commit: "feat: Add feed admin panel"

### Fase 8: Testing & Polish (Sesión 10-11)
- [ ] Testing en local (crear prompts, publicar historias)
- [ ] Testing mobile responsive
- [ ] Testing dark mode
- [ ] Verificar RLS policies
- [ ] Edge cases (word count, estados, etc)
- [ ] Commit: "test: Comprehensive feed system testing"

### Fase 9: Deployment (Sesión 12)
- [ ] Merge a main
- [ ] Deploy a producción
- [ ] Monitorear errores
- [ ] Crear primer prompt de prueba
- [ ] Anunciar feature
- [ ] Commit: "release: Launch feed system v1.0"

---

## 📊 Métricas de Éxito

### KPIs a monitorear:

**Engagement**:
- % usuarios activos semanales (objetivo: 40%+)
- Historias publicadas por semana (objetivo: 30+)
- Comentarios por historia (objetivo: 3+)
- Likes promedio por historia (objetivo: 5+)

**Retención**:
- Usuarios que vuelven cada semana (objetivo: 25%+)
- Prompts con participación (objetivo: 80%+)

**Crecimiento**:
- Nuevos usuarios por mes (baseline: medir)
- Conversión de escritores de feed → retos mensuales (objetivo: 20%+)

**Queries SQL para dashboard**:

```sql
-- Engagement semanal
SELECT
  fp.week_number,
  fp.year,
  COUNT(DISTINCT fs.user_id) as unique_writers,
  COUNT(fs.id) as total_stories,
  AVG(fs.likes_count) as avg_likes,
  AVG(fs.comments_count) as avg_comments
FROM feed_prompts fp
LEFT JOIN feed_stories fs ON fp.id = fs.prompt_id
WHERE fp.status = 'archived'
GROUP BY fp.week_number, fp.year
ORDER BY fp.year DESC, fp.week_number DESC;

-- Top writers del mes
SELECT
  up.display_name,
  COUNT(fs.id) as stories_published,
  SUM(fs.likes_count) as total_likes
FROM feed_stories fs
JOIN user_profiles up ON fs.user_id = up.id
WHERE fs.created_at >= DATE_TRUNC('month', NOW())
GROUP BY up.id, up.display_name
ORDER BY stories_published DESC, total_likes DESC
LIMIT 10;
```

---

## 🎯 Decisiones de Diseño

### ✅ Decisiones confirmadas:

1. **Prompts semanales** (no quincenales)
   - Más dinámico, más oportunidades de escribir
   - Mantiene frescura del feed

2. **Solo publicar con prompts** (no libre)
   - Mantiene foco en escritura guiada
   - Evita spam y contenido off-topic
   - Preserva identidad del sitio

3. **Feed no da karma** (por ahora)
   - Sistema karma se mantiene exclusivo para retos mensuales
   - Futuro: Podemos agregar karma reducido (ej: 1/5 del valor de retos)

4. **Archivados = read-only**
   - Preserva historias como "cápsula de tiempo"
   - Reduce moderación futura
   - Incentiva participación durante semana activa

5. **1 historia por usuario por prompt**
   - Evita spam
   - Fomenta calidad sobre cantidad
   - Unique constraint en BD

6. **50-300 palabras**
   - Bajo compromiso (vs 3000 de retos)
   - Práctica de escritura ágil
   - Mobile-friendly

7. **Preview en landing**
   - Transparencia para no logueados
   - Incentivo para registro
   - No requiere login para descubrir contenido

### 🤔 Decisiones pendientes (para futuro):

- Sistema de karma en feed (cuánto, cómo)
- Badges especiales (ej: "Escritor Semanal", "Streak de 10 semanas")
- Notificaciones (comentarios, likes, nuevo prompt)
- Ordenamiento de historias (¿aleatorio?, ¿por likes?, ¿por fecha?)
- Edición de historias (¿permitir?, ¿hasta cuándo?)
- Límite de historias por usuario (¿ilimitado?, ¿cuota mensual?)

---

## 🔄 Integración con Sistemas Existentes

### No afecta:
- ✅ Sistema de retos mensuales (completamente independiente)
- ✅ Sistema de badges automáticos (retos siguen siendo la fuente)
- ✅ Sistema de karma (por ahora solo retos)
- ✅ Perfiles públicos (compatible, se puede agregar sección de microhistorias)

### Requiere integración:
- **Landing Page**: Agregar preview del feed
- **Navigation**: Agregar link "Feed" en navbar
- **GlobalAppContext**: Agregar funciones de feed
- **Comentarios**: Reutilizar sistema existente (`feed_story_comments` sigue mismo patrón)

### Oportunidades futuras:
- Agregar pestaña "Microhistorias" en perfiles públicos
- Dashboard de stats personales (historias/semana, promedio de likes)
- Badges específicos de feed
- Karma reducido para feed

---

## 🐛 Consideraciones y Edge Cases

### Seguridad:
- ✅ RLS policies impiden publicar en prompts archivados
- ✅ RLS policies impiden comentar en prompts archivados
- ✅ Word count validado en BD (50-300)
- ✅ Unique constraint evita múltiples publicaciones por prompt
- ⚠️ Rate limiting (futuro): Limitar publicaciones por día

### Performance:
- ✅ Índices en todas las queries frecuentes
- ✅ Contadores desnormalizados (stories_count, likes_count)
- ✅ Batch loading de likes (igual que comentarios)
- ⚠️ Infinite scroll: Implementar paginación (20 prompts por página)

### UX:
- ⚠️ ¿Mostrar mensaje si usuario ya publicó en prompt activo?
- ⚠️ ¿Preview de conteo de palabras en tiempo real?
- ⚠️ ¿Autoguardado de draft en localStorage?
- ⚠️ ¿Confirmación antes de publicar?

### Moderación:
- ⚠️ Sistema de reportes (reutilizar existente)
- ⚠️ Admin puede eliminar historias inapropiadas
- ⚠️ Log de acciones admin

---

## 📝 Nomenclatura y Convenciones

### Nombres de tablas:
- `feed_prompts` (no `prompts` - evitar colisión futura)
- `feed_stories` (no `micro_stories` - más claro)
- `feed_story_likes` (consistente con `comment_likes`)
- `feed_story_comments` (consistente con sistema actual)

### Estados de prompt:
- `draft` - Creado pero no publicado
- `active` - Abierto para publicación (7 días)
- `archived` - Cerrado, solo lectura

### Rutas:
- `/feed` - Feed principal (logueados)
- `/feed/prompt/:promptId` - Detalle de prompt
- `/admin/feed` - Panel admin

### Componentes:
- `PromptCard` (no `FeedPromptCard` - contexto claro)
- `MicroStoryCard` (claro y específico)
- `FeedFilters` (no `PromptFilters` - más general)

---

## 🎨 Paleta de Colores

### Estados de prompts:
- **ACTIVO**: `bg-gradient-to-r from-green-500 to-emerald-500` (verde energético)
- **ARCHIVO**: `bg-gray-400` (gris neutro)

### Acciones:
- **Like (activo)**: `text-red-500` con `fill-current`
- **Like (inactivo)**: `text-gray-500`
- **Comentar**: `text-primary-600` (morado marca)

### Componentes:
- **Prompt text**: `bg-primary-50 border-l-4 border-primary-500` (destacado)
- **Story card**: `border border-gray-200 hover:shadow-md` (sutil)

---

## 🔧 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Testing
npm run lint
npm run build

# Git workflow
git status
git add .
git commit -m "feat: Description"
git push origin feature/feed-microhistorias

# Merge a main (cuando esté listo)
git checkout main
git pull origin main
git merge feature/feed-microhistorias
git push origin main
```

---

## 📚 Referencias

**Documentos relacionados**:
- `CLAUDE.md` - Memoria general del proyecto
- `database-scripts/migrations/comment_likes_and_replies.sql` - Patrón similar para likes
- `src/hooks/useReadStories.js` - Patrón para optimistic updates
- `src/components/comments/SimpleComments.jsx` - Sistema de comentarios reutilizable

**Funcionalidades que inspiraron el diseño**:
- Sistema de comentarios (Oct 2024)
- Sistema de historias leídas (Oct 2024)
- Sistema de encuestas (Sept 2024)

---

## ✅ Checklist de Completitud

### Documentación:
- [x] README completo
- [ ] Migración SQL documentada
- [ ] Funciones SQL documentadas
- [ ] Componentes React documentados

### Backend:
- [ ] Tablas creadas
- [ ] Índices optimizados
- [ ] RLS policies aplicadas
- [ ] Funciones SQL testeadas
- [ ] Triggers funcionando

### Frontend:
- [ ] Hooks implementados
- [ ] Componentes creados
- [ ] Rutas configuradas
- [ ] Responsive design
- [ ] Dark mode compatible

### Testing:
- [ ] Tests unitarios (si aplica)
- [ ] Tests de integración
- [ ] Testing manual completo
- [ ] Edge cases cubiertos

### Deploy:
- [ ] Merge a main
- [ ] Deploy exitoso
- [ ] Monitoreo activo
- [ ] Feature anunciada

---

**Última actualización**: Diciembre 30, 2024
**Estado**: 🚧 En desarrollo - Fase 1 (Documentación)
**Próximo paso**: Crear migración SQL
