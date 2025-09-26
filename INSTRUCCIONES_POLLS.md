# 🗳️ Instrucciones de Implementación - Sistema de Votación de Prompts

## 📋 Resumen del Sistema

El sistema de votación de prompts permite a los administradores crear encuestas para que los usuarios voten por opciones de prompts para concursos futuros. Cuando la encuesta termina, se convierte automáticamente en un concurso usando el prompt ganador.

## 🚀 Pasos de Implementación

### 1. Migraciones de Base de Datos

Ejecutar los siguientes archivos SQL en Supabase **en este orden**:

1. **Crear tablas principales:**
   ```sql
   -- Ejecutar: database-scripts/migrations/polls_system_migration.sql
   ```

2. **Configurar permisos RLS:**
   ```sql
   -- Ejecutar: database-scripts/migrations/polls_rls_policies.sql
   ```

3. **Habilitar conversión automática:**
   ```sql
   -- Ejecutar: database-scripts/migrations/polls_auto_conversion.sql
   ```

### 2. Verificar Instalación

Después de ejecutar las migraciones, verificar que se crearon:

**Tablas:**
- ✅ `polls` - Encuestas principales
- ✅ `poll_options` - Opciones de cada encuesta  
- ✅ `poll_votes` - Votos de usuarios

**Funciones:**
- ✅ `get_active_poll_for_next_month()` - Obtiene encuesta activa
- ✅ `manually_convert_poll(UUID)` - Convierte encuesta a concurso
- ✅ `process_expired_polls()` - Procesa encuestas expiradas
- ✅ `auto_convert_closed_polls()` - Conversión automática

**Triggers:**
- ✅ `trigger_poll_conversion` - Convierte encuestas automáticamente
- ✅ `trigger_update_poll_vote_counts` - Actualiza contadores

## 🎯 Cómo Usar el Sistema

### Como Administrador:

1. **Ir al Panel Admin** → Tab "Encuestas"
2. **Crear Nueva Encuesta:**
   - Título: "Elige el prompt para Noviembre 2024"
   - Mes objetivo: "Noviembre 2024"
   - Mes del concurso: "noviembre"
   - Fecha límite: cuando quieres que termine la votación
   - Agregar 3-5 opciones de prompts

3. **Monitorear Resultados:**
   - Ver votos en tiempo real
   - Cerrar encuesta manualmente si es necesario

4. **Conversión Automática:**
   - Al llegar la fecha límite, se convierte automáticamente a concurso
   - O convertir manualmente desde el panel admin

### Como Usuario:

1. **En la Landing Page:** Verán la encuesta en lugar del "Siguiente Concurso"
2. **Votar:** Seleccionar una opción y enviar voto
3. **Cambiar Voto:** Pueden cambiar su voto hasta que termine la encuesta
4. **Ver Resultado:** Cuando termine, aparecerá el nuevo concurso con el prompt ganador

## 🔄 Flujo Completo

```
1. Admin crea encuesta para "Noviembre 2024"
   ↓
2. Usuarios ven encuesta en landing y votan
   ↓
3. Al llegar fecha límite → Conversión automática
   ↓
4. Se crea concurso "Concurso Noviembre 2024" 
   ↓ 
5. Landing muestra el nuevo concurso normalmente
```

## 🛠️ Archivos Modificados/Creados

### Nuevos Archivos:
- `src/lib/supabase-polls.js` - Funciones de backend
- `src/components/ui/PollPreview.jsx` - Interfaz de votación
- `src/components/ui/NextContestOrPoll.jsx` - Wrapper inteligente
- `src/components/admin/PollAdminPanel.jsx` - Panel administrativo
- `database-scripts/migrations/polls_*.sql` - Migraciones

### Archivos Modificados:
- `src/pages/LandingPage.jsx` - Usa NextContestOrPoll en lugar de NextContestPreview
- `src/components/admin/ContestAdminPanel.jsx` - Agrega tab "Encuestas"

## ⚙️ Configuración Automática

El sistema incluye:

- **Triggers de Base de Datos:** Convierten encuestas automáticamente
- **Detección Inteligente:** NextContestOrPoll detecta encuestas activas
- **Fechas Automáticas:** Calcula fechas de concurso automáticamente
- **Contadores en Tiempo Real:** Actualiza votos automáticamente

## 🔒 Seguridad

- Solo usuarios autenticados pueden votar
- Un voto por usuario por encuesta
- Solo admins pueden crear/gestionar encuestas  
- RLS configura permisos correctamente
- Validaciones en frontend y backend

## 🚨 Importante

1. **Probar primero en desarrollo** antes de ejecutar en producción
2. **Hacer backup** de la base de datos antes de las migraciones
3. **Verificar permisos** de admin después de la instalación
4. **El sistema es opcional** - si no hay encuestas activas, funciona como antes

## 🔧 Resolución de Problemas

**Si no aparece la encuesta en landing:**
- Verificar que hay una encuesta con `status = 'active'`
- Verificar que `voting_deadline > NOW()`
- Verificar que `is_active = true`

**Si la conversión automática no funciona:**
- Revisar logs de Supabase
- Ejecutar manualmente: `SELECT process_expired_polls();`
- Verificar que el trigger esté activo

**Si hay errores de permisos:**
- Re-ejecutar `polls_rls_policies.sql`
- Verificar que el usuario tiene `is_admin = true`

---

El sistema está diseñado para ser **completamente automático** una vez configurado. Los admins solo necesitan crear encuestas y el resto se maneja solo.