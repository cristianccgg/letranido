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

### 📊 Sistema de Encuestas (Reciente - Sept 2025)
- **Funcionalidad**: Votación comunitaria por prompts para futuros retos
- **Conversión automática**: Encuesta → reto cuando expira
- **1 voto por encuesta** por usuario autenticado
- **Componentes**: `PollPreview.jsx`, `PollAdminPanel.jsx`, `NextContestOrPoll.jsx`

### 🎖️ Sistema de Badges y Karma
- **Badges automáticos**: Ganadores, finalistas, veteranos
- **Karma system**: Rankings dinámicos de la comunidad
- **Perfiles públicos**: Con métricas y logros de usuarios

### 👥 Sistema de Usuarios
- **Autenticación**: Supabase Auth
- **Perfiles**: Públicos con estadísticas, badges, karma
- **Roles**: Admin panel para moderación
- **Privacy**: Configuraciones de privacidad para perfiles

## Arquitectura del Código

### Estructura de Carpetas Clave
```
src/
├── contexts/GlobalAppContext.jsx     # Estado global principal
├── pages/
│   ├── CurrentContest.jsx           # Página del reto actual
│   ├── LandingPage.jsx             # Landing con ganadores
│   └── AuthorProfile.jsx           # Perfiles públicos
├── components/
│   ├── admin/                      # Paneles de administración
│   ├── ui/                        # Componentes reutilizables
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
- `user_profiles` - Perfiles con estadísticas
- `polls`, `poll_options`, `poll_votes` - Sistema de encuestas

## Trabajo en Progreso

### 🚧 Rama Pendiente: `feature/public-author-profiles`
- **Estado**: Rama creada, sin merge a main
- **Contenido**: Sistema de perfiles públicos de autores
- **Implementación**: Planificada para próximos días
- **Nota**: Ya existe `AuthorProfile.jsx` pero será mejorado

### 📢 Comunicación de Nuevas Features (Oct 2024)

#### Banner de Resultados - `WelcomeBanner.jsx`
- **Propósito**: Anunciar resultados de retos mensuales
- **Características**: Dismissible, scroll a ganadores, responsive
- **Ubicación**: Landing page
- **Persistencia**: Reaparece al refrescar (no usa localStorage)

#### Modal "Coming Soon" - `ComingSoonModal.jsx`
- **Propósito**: Anunciar próximas funcionalidades pedidas por la comunidad
- **Características avanzadas**:
  - Animaciones con confetti (canvas-confetti)
  - Reveal progresivo de features con delays
  - Bloqueo de scroll cuando está abierto
- **Features anunciadas**:
  1. **Perfiles Públicos**: Bio, redes, portfolio, seguir autores
  2. **Marcar como Leído**: Organizar lectura durante votaciones
  3. **Ko-fi Supporters**: Badge exclusivo para quienes apoyan
- **UX**: Confetti explosion al abrir + mini confetti al cerrar

## Flujos de Trabajo Típicos

### Desarrollo
```bash
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

## Comandos Frecuentes
```bash
npm run lint                 # Siempre verificar antes de commits
npm run env:status          # Ver configuración BD actual
npm run dev:local           # Desarrollo local
git status                  # Estado del repo
```

## Patterns de Código
- **Estado global**: `GlobalAppContext` para datos compartidos
- **Custom hooks**: Para lógica reutilizable específica
- **Componentes UI**: Reutilizables en `/ui`
- **Supabase calls**: Centralizados en `/lib`

## Configuración Crítica
- **Variables env**: Switching automático local/prod
- **RLS policies**: Seguridad estricta en BD
- **Edge functions**: Para emails (Supabase)
- **Vercel deployment**: Build automático desde main

---

**Objetivo**: Este archivo permite que Claude recuerde automáticamente la estructura, funcionalidades y puntos críticos del proyecto Letranido sin necesidad de re-explicación en cada sesión.