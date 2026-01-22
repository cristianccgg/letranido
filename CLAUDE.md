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

### 🎖️ Sistema de Badges y Karma (✅ ACTUALIZADO Enero 2026)
- **Badges automáticos**: Ganadores, finalistas, veteranos, participación, comunidad
- **Ko-fi Supporter Badge**: Badge especial con gradiente rosado y shimmer dorado
- **Karma system**: Rankings dinámicos de la comunidad
- **Perfiles públicos**: Con métricas y logros de usuarios
- **Asignación**: Automática al publicar historias (`check_and_award_badges`)
- **Tipos de badges (14 totales)**:
  - **Escritura**: `first_story` (1), `writer_5` (5), `writer_15` (15), `writer_25` (25 historias)
  - **Participación**: `participant_3` (3), `participant_6` (6), `participant_10` (10 retos)
  - **Comunidad**: `explorer_30` (30 autores leídos), `voter_10` (10 retos votados)
  - **Concursos**: `contest_winner`, `contest_finalist` (repetibles por reto)
  - **Logros**: `contest_winner_veteran` (2+ victorias), `contest_winner_legend` (5+ victorias)
  - **Especiales**: `kofi_supporter` (donantes)
- **⚠️ CRÍTICO**: Sin constraint UNIQUE, usa lógica `EXISTS()` para prevenir duplicados
- **Fix Dic 2024**: Corregido conteo de victorias (solo `winner_position = 1`)
- **Enero 2026**: Agregados 6 nuevos badges (participación, comunidad, escritura avanzada)

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

## Arquitectura del Código

### Estructura de Carpetas Clave
```
src/
├── contexts/GlobalAppContext.jsx     # Estado global principal
├── pages/
│   ├── CurrentContest.jsx           # Página del reto actual
│   ├── LandingPage.jsx             # Landing con ganadores
│   └── AuthorProfile.jsx           # Perfiles públicos ✅
├── components/
│   ├── admin/                      # Paneles de administración
│   ├── ui/                        # Componentes reutilizables
│   │   ├── ProfileButton.jsx      # Botón de perfil inline ✅
│   │   ├── SocialLinksEditor.jsx  # Editor de redes sociales ✅
│   │   └── UserCardWithBadges.jsx # Con ProfileButton integrado ✅
│   └── voting/                    # Sistema de votación
├── hooks/                         # Custom hooks
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

4. **🔥 Bug CRÍTICO de ambigüedad SQL (Enero 4, 2026)** ❌→✅
   - **Problema**: `award_specific_badge()` tenía variable local `badge_id` con mismo nombre que columna de tabla
   - **Causa**: PostgreSQL no podía resolver `badge_id = badge_id` (variable vs columna)
   - **Síntoma**: Badges NO se asignaban al finalizar concursos desde Diciembre 21, 2024
   - **Impacto**: TODOS los ganadores desde Diciembre 2024 no recibieron badges automáticamente
   - **Fix aplicado**: Renombrar variable a `v_badge_id` (prefijo `v_` para "variable")
   - **Script de corrección**: `fix_award_specific_badge_ambiguity.sql` (Enero 4, 2026)
   - **Script de recuperación**: `fix_december_2024_badges.sql` - Asignar badges faltantes manualmente
   - **Root cause**: El fix de Diciembre 21 (`fix_badges_without_unique_constraint.sql`) introdujo este bug

**Estado actual**: ✅ Sistema funcionando correctamente (después del fix Enero 4, 2026)
- Badges automáticos se asignan al publicar historias
- Badges de victorias solo cuentan primer lugar
- Badges de concursos pueden repetirse (uno por concurso)
- Función `award_specific_badge()` corregida (sin ambigüedad)
- Badges de Diciembre 2025 asignados manualmente

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

### ✅ Enero 2026 - Sistema de Resultados

1. **Eliminación de Menciones de Honor**
   - **Razón**: Evitar confusión con empates múltiples (3+ personas con mismos votos)
   - **Cambio**: Solo se reconocen 3 posiciones (1º, 2º, 3º lugar)
   - **Criterio de desempate**: Aclarado en podio que si hay empate, quien envió primero queda mejor posicionado
   - **Archivos modificados**:
     - `useContestFinalization.js` - Eliminada lógica de detección
     - `LandingPage.jsx` - Eliminado banner y tarjeta de mención
     - `CurrentContest.jsx` - Eliminado banner informativo y badge
     - `ContestAdminPanel.jsx` - Eliminado de simulación y preview

2. **🔥 FIX CRÍTICO: Race Condition en Badges de Finalización** (Enero 4, 2026)
   - **Problema detectado**: Badges de ganadores NO se asignaban automáticamente al finalizar retos
   - **Causa raíz**: Race condition - se re-consultaba `wins_count` después de actualizarlo, pero la query retornaba valor antiguo por caché/replicación
   - **Solución aplicada**: Usar `newWinsCount` calculado en memoria en lugar de re-consultar BD
   - **Afectados**: Diciembre 2024 - badges no asignados (solucionado con script manual)
   - **Archivos modificados**:
     - `src/hooks/useContestFinalization.js` - Fix de race condition (líneas 105-217)
     - `database-scripts/diagnostics/diagnose_december_badges.sql` - Script diagnóstico
     - `database-scripts/fixes/fix_december_2024_badges.sql` - Script de corrección manual
   - **Mejoras añadidas**:
     - Logs detallados de cada paso del proceso de asignación
     - Verificación explícita de `newWinsCount` antes de badges veterano/leyenda
     - Mensajes informativos cuando usuario no califica aún

---

### ✅ Enero 22, 2026 - Nuevos Badges de Participación y Comunidad

**6 nuevos badges agregados** para incentivar participación y engagement:

1. **Escritura Avanzada**
   - `writer_25` (Novelista) - 25 historias publicadas

2. **Participación en Retos** (progresión 3 → 6 → 10)
   - `participant_3` (Participante) - 3 retos
   - `participant_6` (Participante Fiel) - 6 retos
   - `participant_10` (Veterano de Retos) - 10 retos

3. **Comunidad**
   - `explorer_30` (Explorador) - Leer de 30 autores distintos
   - `voter_10` (Votante Comprometido) - Votar en 10 retos diferentes

**Archivos modificados:**
- `database-scripts/migrations/new_badges_january_2026.sql` - Script SQL completo
- `src/components/ui/Badge.jsx` - Nuevos iconos y colores
- `src/components/ui/UserCardWithBadges.jsx` - Prioridades actualizadas
- `src/hooks/useBadges.js` - Soporte para nuevos tipos de badges

**Función SQL actualizada:** `check_and_award_badges()` ahora soporta:
- `story_count` - Historias publicadas
- `contest_wins` - Victorias en primer lugar
- `contest_participation` - Retos participados (nuevo)
- `unique_authors_read` - Autores leídos (nuevo)
- `contests_voted` - Retos votados (nuevo)

**Asignación retroactiva:** Ejecutar `SELECT * FROM assign_retroactive_badges();` después de aplicar migración

---

**Objetivo**: Este archivo permite que Claude recuerde automáticamente la estructura, funcionalidades y puntos críticos del proyecto Letranido sin necesidad de re-explicación en cada sesión.

**Última actualización**: Enero 22, 2026 - 6 nuevos badges de participación y comunidad
