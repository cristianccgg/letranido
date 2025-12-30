# Memoria del Proyecto - Letranido

## Contexto General
**Letranido** es una plataforma de escritura creativa donde los usuarios participan en retos mensuales, votan por historias favoritas y descubren nuevos talentos literarios. Es un proyecto muy avanzado con múltiples sistemas integrados.

## Stack Tecnológico
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Vercel
- **Zona Horaria**: Colombia (UTC-5)

## Sistemas Principales

### 🏆 Sistema de Retos (Core)
- **Fases automáticas**: `submission` → `voting` → `counting` → `results`
- **Transiciones**: Por fechas automáticas, excepto `results` que es manual
- **Votación**: 3 votos máximo por usuario en reto actual
- **Finalización**: Manual por admin genera ganadores y badges

### 📊 Sistema de Encuestas (Sept 2025)
- **Funcionalidad**: Votación comunitaria por prompts para futuros retos
- **Conversión automática**: Encuesta → reto cuando expira
- **1 voto por encuesta** por usuario autenticado
- **Componentes**: `PollPreview.jsx`, `PollAdminPanel.jsx`, `NextContestOrPoll.jsx`

### 🎖️ Sistema de Badges y Karma (✅ FIX APLICADO Dic 2024)
- **Badges automáticos**: Ganadores, finalistas, veteranos
- **Ko-fi Supporter Badge**: Badge especial con gradiente rosado y shimmer dorado
- **Karma system**: Rankings dinámicos de la comunidad
- **Perfiles públicos**: Con métricas y logros de usuarios
- **Asignación**: Automática al publicar historias (`check_and_award_badges`)
- **Tipos de badges**:
  - **Únicos**: `first_story`, `writer_5`, `writer_15`, `contest_winner_veteran`, `contest_winner_legend`
  - **Repetibles**: `contest_winner`, `contest_finalist` (uno por concurso ganado)
- **⚠️ CRÍTICO**: Sin constraint UNIQUE, usa lógica `EXISTS()` para prevenir duplicados
- **Fix Dic 2024**: Corregido conteo de victorias (solo `winner_position = 1`)

### 👥 Sistema de Perfiles Públicos (Oct 2024 - ✅ EN PRODUCCIÓN)
- **Autenticación**: Supabase Auth
- **Perfiles públicos completos**:
  - Biografía, país, redes sociales, sitio web
  - Todas las historias del usuario visibles
  - Estadísticas, badges, karma
  - **Privacy controls**: Toggle para ocultar perfil completo
- **ProfileButton**: Botón morado con icono de usuario
  - Integrado en `UserCardWithBadges`
  - Aparece automáticamente junto a cada nombre de usuario
  - Presente en: Landing, CurrentContest, StoryPage, ContestHistory, FreeStories
- **Ruta**: `/author/:userId`
- **Componentes**: `AuthorProfile.jsx`, `ProfileButton.jsx`, `SocialLinksEditor.jsx`

### 📖 Sistema de Historias Leídas (Oct 2024 - ✅ EN PRODUCCIÓN)
- **Tracking automático**: Se marca como leída tras 15 segundos en la historia
- **Badge visual**: "📖 Leída" en centro de tarjeta (clickeable para desmarcar)
- **Ordenamiento inteligente**: No leídas primero, leídas al final (en fase votación)
- **Progreso unificado**: Banner con votos + contador de lectura
- **Distribución equitativa**: Mejora las oportunidades de todas las historias
- **Tabla BD**: `user_story_reads` con funciones SQL optimizadas
- **Hook**: `useReadStories.js` para gestión completa del sistema

### 📱 Sistema de Feed (Dic 2024 - ✅ EN PRODUCCIÓN)
- **Funcionalidad**: Red social de microhistorias (50-300 palabras) basadas en prompts semanales
- **Diseño**: Estilo Instagram/Facebook - todo en una página con scroll continuo
- **Integración**: Feed integrado en landing page autenticada (debajo de banners de concursos)
- **Características principales**:
  - Prompts semanales rotativos (`active` → `archived`)
  - 1 historia por usuario por prompt
  - Likes en historias (optimistic UI, sin reload)
  - Comentarios anidados (1 nivel: comentario → respuesta)
  - Likes en comentarios (optimistic UI)
  - Delete y report para historias y comentarios
  - Vista de archivo para prompts pasados
  - Toggle entre vista actual y archivo
- **Ubicación**:
  - **Landing autenticada**: Feed aparece debajo de banners de concurso (vista principal)
  - **Ruta `/feed`**: Vista dedicada (accesible desde navegación)
- **Tablas BD**:
  - `feed_prompts` - Prompts con estados (active/archived)
  - `feed_stories` - Microhistorias con word_count
  - `feed_story_likes` - Tracking de likes por usuario
  - `feed_story_comments` - Comentarios con parent_id
  - `feed_comment_likes` - Likes en comentarios
- **Componentes**:
  - `LandingPage.jsx` - Integra feed completo para usuarios autenticados
  - `FeedPage.jsx` - Vista dedicada del feed (ruta `/feed`)
  - `MicroStoryCard.jsx` - Tarjeta de historia estilo red social
  - `FeedCommentsSection.jsx` - Sistema de comentarios con respuestas
  - `ArchivedPromptsView.jsx` - Vista de prompts pasados
- **Hooks**: `useFeedPrompts.js`, `useMicroStories.js`
- **Funciones SQL**:
  - `toggle_feed_story_like()` - Like/unlike automático
  - `toggle_feed_comment_like()` - Like/unlike en comentarios
  - `get_user_feed_story_likes_batch()` - Batch loading de likes
  - `get_user_feed_comment_likes_batch()` - Batch loading de likes de comentarios
- **⚠️ CRÍTICO**:
  - Optimistic updates en todos los likes (no recargan página)
  - Manual JOIN workaround para evitar errores de Supabase schema
  - Triggers automáticos para contadores (likes_count, comments_count)
  - Feed solo visible para usuarios autenticados
  - Landing no autenticada mantiene diseño original completo

## Arquitectura del Código

### Estructura de Carpetas Clave
```
src/
├── contexts/GlobalAppContext.jsx     # Estado global principal
├── pages/
│   ├── CurrentContest.jsx           # Página del reto actual
│   ├── LandingPage.jsx             # Landing con ganadores
│   ├── AuthorProfile.jsx           # Perfiles públicos ✅
│   └── FeedPage.jsx                # Feed de microhistorias ✅
├── components/
│   ├── admin/                      # Paneles de administración
│   ├── feed/                       # Sistema de feed ✅
│   │   ├── MicroStoryCard.jsx     # Tarjeta de historia
│   │   ├── FeedCommentsSection.jsx # Sistema de comentarios
│   │   ├── FeedStoryComments.jsx  # Adaptador de comentarios
│   │   └── ArchivedPromptsView.jsx # Vista de archivo
│   ├── ui/                        # Componentes reutilizables
│   │   ├── ProfileButton.jsx      # Botón de perfil inline ✅
│   │   ├── SocialLinksEditor.jsx  # Editor de redes sociales ✅
│   │   └── UserCardWithBadges.jsx # Con ProfileButton integrado ✅
│   └── voting/                    # Sistema de votación
├── hooks/                         # Custom hooks
│   ├── useFeedPrompts.js         # Gestión de prompts del feed ✅
│   └── useMicroStories.js        # Gestión de microhistorias ✅
└── lib/                          # Utilidades y configuración
```

### Funciones Críticas
- `getContestPhase(contest)` - Determina fase actual por fechas
- `findCurrentContest(contests)` - Selecciona reto activo
- `finalizeContest(contestId)` - Genera resultados y ganadores
- `canVoteInStory(storyId)` - Valida permisos de votación

### Base de Datos
**Tablas principales:**
- `contests` - Retos con fechas límite y estados
- `stories` - Historias con flags de ganadores
- `votes` - Sistema de votación limitado
- `user_profiles` - Perfiles con estadísticas, biografía, país, redes sociales
  - Columnas nuevas: `bio`, `country`, `social_links` (JSON), `profile_is_public`
- `polls`, `poll_options`, `poll_votes` - Sistema de encuestas
- `user_story_reads` - Tracking de historias leídas ✅
- **Feed system** (Dic 2024):
  - `feed_prompts` - Prompts semanales con estados
  - `feed_stories` - Microhistorias (50-300 palabras)
  - `feed_story_likes` - Likes por usuario en historias
  - `feed_story_comments` - Comentarios con parent_id
  - `feed_comment_likes` - Likes por usuario en comentarios

## Comunicación de Features

### 📢 Modal de Anuncios - `FeatureAnnouncementModal.jsx` (✅ ACTIVO)
- **Propósito**: Anunciar features YA DISPONIBLES
- **Título**: "¡Novedades!"
- **Características**:
  - Modal compacto optimizado para mobile
  - Aparece automáticamente 1.5s después de cargar Landing
  - Se muestra UNA VEZ por usuario (localStorage: `feature_announcement_perfiles_{userId}`)
- **Features anunciadas**:
  1. **✨ Perfiles Públicos**: "Crea tu perfil con biografía, país y redes sociales. Todas tus historias visibles en un solo lugar."
  2. **📖 Lectura Rastreada**: "Marca automáticamente historias como leídas"
  3. **☕ Badge Ko-fi Supporter**: Icono ❤️ con gradiente rosado (from-pink-400 via-rose-500 to-red-500)
- **CTA**: "Completar mi perfil" → Link a `/profile`
- **Ubicación**: `LandingPage.jsx` (reemplazó a ComingSoonModal)

### Banner de Resultados - `WelcomeBanner.jsx`
- **Propósito**: Anunciar resultados de retos mensuales
- **Características**: Dismissible, scroll a ganadores, responsive
- **Ubicación**: Landing page
- **Persistencia**: Reaparece al refrescar (no usa localStorage)

## Privacidad y Legal

### 📋 Política de Privacidad (✅ ACTUALIZADA Oct 2024)
- **Sección 1.2**: Información de Perfil Público (Opcional)
  - Biografía, país, redes sociales, sitio web
  - TODO es opcional y controlado por el usuario
  - Email NUNCA se muestra públicamente
- **Sección 3.1**: Información Públicamente Visible
  - Énfasis en control del usuario
  - Opción de ocultar perfil completo
  - GDPR compliant
- **Ubicación**: `/privacy`

## Flujos de Trabajo Típicos

### Desarrollo
```bash
npm run dev          # Desarrollo (usa .env.local)
npm run dev:local    # BD local
npm run dev:prod     # BD producción
npm run lint         # Verificar código
npm run build        # Build producción
```

### Administración
- **Panel Admin**: `/admin` (solo `is_admin: true`)
- **Finalizar retos**: Proceso manual crítico
- **Gestión encuestas**: Crear y convertir a retos
- **Moderación**: Panel completo de reportes

### Estados UI Críticos
- **Landing containers**: Superior (actual) + Inferior (siguiente)
- **Fases visuales**: Mensajes automáticos por fase
- **Votación ciega**: Sin conteos hasta finalización

## Puntos Críticos de Memoria

### ⚠️ Zona Horaria
- **Todo en Colombia (UTC-5)**
- Fechas BD en UTC, conversión automática
- Cierres automáticos a las 7:00 PM Colombia

### ⚠️ Proceso de Votación
- **3 votos máximo** solo en reto actual
- **Votación ciega** durante fase `voting`
- **Bloqueo automático** en fases `counting`/`results`

### ⚠️ Finalización de Retos
- **Única acción manual**: Admin debe finalizar
- **Automático después**: Rotación de retos, badges, stats
- **Crítico**: No tocar hasta `status: "results"`

### ⚠️ Sistema de Encuestas
- **Integración reciente** (Sept 2025)
- **Conversión automática** por triggers
- **1 voto por encuesta**, cambio permitido

### ⚠️ Sistema de Badges (CRÍTICO - Dic 2024)
- **Asignación automática**: Al publicar historias vía `check_and_award_badges()`
- **Sin constraint UNIQUE**: Badges de concursos se pueden repetir
- **Victorias = solo 1er lugar**: Query debe usar `winner_position = 1`
- **Tipo de datos**: Todas las funciones usan `JSONB` no `JSON`
- **Verificación de duplicados**: Usa `EXISTS()` no `ON CONFLICT`
- **Auditoría**: Ejecutar `verify_all_badges_comprehensive.sql` mensualmente
- **Scripts importantes**:
  - `database-scripts/fixes/fix_badges_without_unique_constraint.sql` - Última versión corregida
  - `database-scripts/fixes/BADGE_SYSTEM_AUDIT.md` - Documentación completa

### ⚠️ Features Premium
- **DESACTIVADAS**: Código existe pero no está público
- Flags: `PREMIUM_PLANS`, `PREMIUM_EDITOR`, `PORTFOLIO_STORIES` (todos `false`)
- Rutas existen (`/planes`) pero no están enlazadas en navegación
- Menciones en `/support` son correctas (transparencia futura)

## Comandos Frecuentes
```bash
npm run lint                 # Siempre verificar antes de commits
npm run build                # Verificar que compile
npm run dev                  # Desarrollo local
git status                   # Estado del repo
git checkout main            # Cambiar a main
git pull origin main         # Actualizar main
```

## Patterns de Código
- **Estado global**: `GlobalAppContext` para datos compartidos
- **Custom hooks**: Para lógica reutilizable específica
- **Componentes UI**: Reutilizables en `/ui`
- **Supabase calls**: Centralizados en `/lib`
- **ProfileButton**: Integrado en `UserCardWithBadges` para aparecer automáticamente

## Configuración Crítica
- **Variables env**: Switching automático local/prod
- **RLS policies**: Seguridad estricta en BD
- **Edge functions**: Para emails (Supabase)
- **Vercel deployment**: Build automático desde main
- **Feature flags**: Controlados en `src/lib/config.js`

## Últimos Cambios

### ✅ Diciembre 2024 - Fix Sistema de Badges

**Problema reportado**: Usuario recibió badge "Ganador Veterano" incorrectamente al publicar su 5ta historia.

**Bugs encontrados y corregidos**:

1. **Bug de conteo de victorias** ❌→✅
   - **Problema**: `check_and_award_badges()` contaba TODAS las posiciones ganadoras (1º, 2º, 3º)
   - **Causa**: Query usaba `is_winner = true` sin verificar `winner_position`
   - **Fix**: Cambiado a `is_winner = true AND winner_position = 1`
   - **Impacto**: 1 usuario afectado (badge removido)

2. **Bug de tipo de datos JSON/JSONB** ❌→✅
   - **Problema**: Función declaraba `JSON` pero usaba operaciones `JSONB`
   - **Causa**: Type mismatch causaba fallos silenciosos
   - **Fix**: Cambiado retorno y variable a `JSONB`

3. **Bug de constraint UNIQUE** ❌→✅
   - **Problema**: Constraint `UNIQUE(user_id, badge_id)` impedía múltiples badges de concursos
   - **Causa**: Diseño original incorrecto para badges repetibles
   - **Fix**: Eliminado `ON CONFLICT`, ahora usa `EXISTS()` para verificar duplicados
   - **Resultado**: Badges de concursos pueden repetirse correctamente

**Archivos modificados**:
- `database-scripts/fixes/fix_badges_without_unique_constraint.sql` - Fix final aplicado
- `database-scripts/fixes/verify_all_badges_comprehensive.sql` - Script de auditoría
- `database-scripts/fixes/BADGE_SYSTEM_AUDIT.md` - Documentación completa

**Funciones SQL actualizadas**:
- `check_and_award_badges(UUID)` - Ahora retorna JSONB, usa EXISTS() en lugar de ON CONFLICT
- `award_specific_badge(UUID, VARCHAR, UUID)` - Soporta badges repetibles por contest_id
- `assign_badge_manual(UUID, VARCHAR)` - Nueva función helper para asignación manual

**Estado actual**: ✅ Sistema funcionando correctamente
- Badges automáticos se asignan al publicar historias
- Badges de victorias solo cuentan primer lugar
- Badges de concursos pueden repetirse (uno por concurso)
- 3 badges huérfanos de cuentas de prueba (opcional limpiar)

---

### ✅ Octubre 2024 - Perfiles y Features

1. **Sistema de Perfiles Públicos**
   - Biografía, país, redes sociales, sitio web
   - Privacy controls completos
   - ProfileButton integrado en UserCardWithBadges
   - Política de privacidad actualizada

2. **Sistema de Historias Leídas**
   - Tracking automático tras 15 segundos
   - Badge visual y ordenamiento inteligente
   - Tabla BD optimizada

3. **Ko-fi Supporter Badge**
   - Badge especial con gradiente rosado
   - Shimmer effect dorado
   - Visible en toda la plataforma

4. **Modal de Anuncios**
   - FeatureAnnouncementModal optimizado para mobile
   - Reemplazó ComingSoonModal
   - Aparece automáticamente a usuarios logueados

### 📝 Ramas de Respaldo
- `backup-antes-merge-20251024` - Backup antes del merge a main

---

**Objetivo**: Este archivo permite que Claude recuerde automáticamente la estructura, funcionalidades y puntos críticos del proyecto Letranido sin necesidad de re-explicación en cada sesión.

**Última actualización**: Diciembre 21, 2024 - Post-fix Sistema de Badges
