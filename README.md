# Letranido - Plataforma de Escritura Creativa

Letranido es una plataforma de retos de escritura donde los usuarios participan en retos mensuales, votan por sus historias favoritas y descubren nuevos talentos literarios.

## 🚀 Tecnologías

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Vercel
- **Zona Horaria**: Colombia (UTC-5)

## 📋 Comandos Principales

```bash
npm run dev          # Desarrollo local
npm run dev:local    # Desarrollo con BD local
npm run dev:prod     # Desarrollo con BD producción
npm run build        # Build para producción
npm run lint         # ESLint
npm run env:status   # Ver configuración actual
```

## 🏆 Flujo de Retos

### Fases Automáticas (por fecha/tiempo)
1. **`submission`** - Hasta `submission_deadline` ⏰
2. **`voting`** - Hasta `voting_deadline` ⏰
3. **`counting`** - Después de `voting_deadline` ⏰
4. **`results`** - Solo cuando admin finaliza manualmente ✋

### Transiciones Críticas
- **7:00 PM Colombia**: Cierre automático de votación
- **Fase "counting"**: Votación bloqueada, reto sigue siendo "actual"
- **Finalización manual**: Marca `status: "results"` + `finalized_at`
- **Rotación automática**: Siguiente reto → actual

## 🔧 Archivos Clave

### Frontend Principal
- `src/contexts/GlobalAppContext.jsx` - Estado global y lógica principal
- `src/pages/CurrentContest.jsx` - Página del reto actual
- `src/pages/LandingPage.jsx` - Landing page con ganadores
- `src/pages/StoryPage.jsx` - Vista individual de historia

### Lógica de Retos
- `src/hooks/useContestFinalization.js` - Finalización y generación de resultados
- `src/components/admin/ContestAdminPanel.jsx` - Panel de administración

### Funciones Críticas
- `getContestPhase(contest)` - Determina fase actual por fechas
- `findCurrentContest(contests)` - Selecciona reto activo
- `finalizeContest(contestId)` - Genera resultados y marca ganadores
- `canVoteInStory(storyId)` - Valida permisos de votación

## 🗳️ Sistema de Votación

### Reglas
- **3 votos máximo** por usuario en el reto actual
- **Votación ciega** durante fase `voting` (sin ver conteos)
- **Votos privados** - solo el usuario ve sus votos
- **Bloqueo automático** en fases `submission`, `counting`, `results`

### Determinación de Ganadores
1. **Ordenamiento**: Por `likes_count` descendente, luego `created_at` ascendente
2. **Top 3**: Marcados con `is_winner: true` y `winner_position: 1,2,3`
3. **Badges automáticos**: `contest_winner`, `contest_finalist`, `contest_winner_veteran`
4. **Actualización stats**: Incrementa `wins_count` en `user_profiles`

## 📱 UI Estados

### Landing Page Containers
- **Superior**: Reto actual (todas las fases)
- **Inferior**: Siguiente reto (siempre `phase: "submission"`)
- **Sección Ganadores**: Solo retos con `status: "results"` (excluyendo actual)

### Mensajes por Fase
- **submission**: "📝 Período de Envío"
- **voting**: "🗳️ Votación Activa"
- **counting**: "⏱️ Votación Cerrada" (automática, transparente)
- **results**: "🏆 Resultados Finales"

## 🛠️ Zona Horaria y Fechas

### Configuración
- **Zona horaria principal**: Colombia (UTC-5)
- **Fechas en BD**: UTC (ISO strings)
- **Comparaciones**: Automáticas por `getContestPhase()`

### Funciones de Conversión
- `toColombiaISO()` - DateTime local → UTC para BD
- `utcToColombiaLocal()` - UTC de BD → DateTime local
- `formatColombiaDateTime()` - Para emails y displays

## 🚨 Proceso de Cierre de Reto

### Antes del Cierre (6:59 PM)
- Reto actual en fase `voting`
- Usuarios pueden votar normalmente
- Siguiente reto visible en contenedor inferior

### Cierre Automático (7:00 PM)
- **Automático**: Fase cambia a `counting`
- **UI**: "⏱️ Votación Cerrada" 
- **Votación**: Bloqueada con mensaje transparente
- **Retos**: Misma disposición (actual/siguiente)

### Finalización Manual (Admin)
- **Panel Admin**: Botón "Finalizar Reto"
- **Backend**: `finalizeContest()` procesa ganadores
- **Actualización**: `status: "results"` + `finalized_at`
- **Rotación**: Siguiente → actual, nuevo siguiente → contenedor

## 📊 Base de Datos

### Tablas Principales
- `contests` - Retos y fechas límite
- `stories` - Historias con `is_winner`, `winner_position`
- `votes` - Votos de usuarios (3 max por reto actual)
- `user_profiles` - Usuarios con `wins_count`

### Estados de Reto
- `status`: `'submission'`, `'voting'`, `'results'` (manual)
- `finalized_at`: NULL hasta finalización manual
- **Fases calculadas**: Por comparación de fechas en tiempo real

## ⚠️ Puntos Críticos

1. **Zona horaria**: Todo en Colombia (UTC-5)
2. **Fases automáticas**: Por fechas, no por `status`
3. **Votación limitada**: 3 votos solo en reto actual
4. **Finalización manual**: Único momento que cambia `status: "results"`
5. **Transparencia**: Mensajes indican procesos automáticos

## 🔍 Debug y Troubleshooting

### Logs Importantes
- `🔄 loadContests` - Carga y determina retos actual/siguiente
- `🗳️ VotingInfo` - Validación de permisos de voto
- `🏆 Ganadores determinados` - Proceso de finalización

### Comandos Útiles
```bash
npm run env:status    # Ver configuración BD actual
npm run lint          # Verificar errores
git status            # Estado del repositorio
```

### Panel Admin
- **URL**: `/admin` (solo usuarios con `is_admin: true`)
- **Funciones**: Finalizar retos, previsualizar ganadores, revertir

## 🎯 Flujo Típico de Reto

1. **Creación**: Admin crea reto con fechas
2. **Submission**: Usuarios envían historias hasta `submission_deadline`
3. **Voting**: Votación hasta `voting_deadline` (automático)
4. **Counting**: UI muestra "cerrado", votación bloqueada (automático)
5. **Results**: Admin finaliza manualmente, ganadores generados
6. **Rotación**: Siguiente reto → actual automáticamente

---

*Última actualización: Septiembre 2025 - Sistema de fases mejorado para transparencia*