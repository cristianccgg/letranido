# 🗳️ Sistema de Votación de Prompts - Literatura

## 📝 **Resumen del Proyecto**

Sistema genérico de encuestas para permitir que los usuarios voten por prompts de futuros concursos. Implementación flexible que se puede activar opcionalmente en cualquier mes.

### 🎯 **Objetivo**
- Permitir a los usuarios votar por opciones de prompts para concursos futuros
- Sistema reutilizable para cualquier mes (no solo noviembre)
- Integración perfecta con el flujo actual de concursos

---

## 🔄 **Flujo de Funcionamiento**

```
1. Concurso Actual Activo (ej: Septiembre)
   ↓
2. [OPCIONAL] Admin crea encuesta para mes siguiente (ej: para Noviembre)
   ↓
3. Durante Octubre: Usuarios ven encuesta en lugar de NextContest
   ↓
4. Encuesta termina → Admin ve resultados
   ↓
5. Admin crea concurso con prompt ganador
   ↓
6. NextContest normal con prompt elegido por comunidad
```

---

## 🗄️ **Estructura de Base de Datos**

### Nueva tabla: `polls`
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_month VARCHAR(50) NOT NULL, -- 'Noviembre 2024', 'Marzo 2025', etc.
  target_contest_month VARCHAR(20) NOT NULL, -- 'noviembre', 'marzo', etc.
  voting_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  total_votes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

### Nueva tabla: `poll_options`
```sql
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_title VARCHAR(255) NOT NULL,
  option_description TEXT,
  display_order INTEGER DEFAULT 1,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Nueva tabla: `poll_votes`
```sql
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Un voto por usuario por encuesta
);
```

---

## 🎨 **Componentes a Crear**

### 1. `PollPreview.jsx`
**Ubicación:** `src/components/ui/PollPreview.jsx`

**Funcionalidad:**
- Muestra encuesta activa con opciones de prompt
- Sistema de votación (1 voto por usuario)
- Contador de tiempo hasta cierre
- Diseño similar a NextContestPreview
- Estados: votación abierta, cerrada, resultados

**Props:**
```javascript
{
  poll: {
    id, title, description, target_month, 
    voting_deadline, status, options: []
  },
  onVote: (optionId) => {},
  userVote: optionId | null,
  isAuthenticated: boolean
}
```

### 2. `PollAdminPanel.jsx`
**Ubicación:** `src/components/admin/PollAdminPanel.jsx`

**Funcionalidad:**
- Crear nuevas encuestas
- Gestionar opciones de prompts
- Ver resultados en tiempo real
- Cerrar encuestas manualmente
- Crear concurso con prompt ganador

### 3. Modificar `NextContestPreview.jsx`
**Cambios:**
- Detectar si hay poll activa para el siguiente mes
- Si hay poll: mostrar `<PollPreview />`
- Si no hay poll: mostrar nextContest normal
- Lógica condicional basada en estado de poll

---

## 🔧 **Modificaciones al Backend**

### GlobalAppContext.jsx
**Nuevas funciones:**
```javascript
// Poll state
const [activePoll, setActivePoll] = useState(null);
const [pollLoading, setPollLoading] = useState(false);
const [userPollVote, setUserPollVote] = useState(null);

// Poll functions
const loadActivePoll = async () => { ... };
const voteOnPoll = async (optionId) => { ... };
const getUserPollVote = async (pollId) => { ... };
```

### Nuevas funciones de Supabase
**Ubicación:** `src/lib/supabase-polls.js`
```javascript
// Obtener poll activa
export const getActivePoll = async () => { ... };

// Votar en poll
export const submitPollVote = async (pollId, optionId, userId) => { ... };

// Obtener voto del usuario
export const getUserVoteForPoll = async (pollId, userId) => { ... };

// Admin: Crear poll
export const createPoll = async (pollData) => { ... };

// Admin: Obtener resultados
export const getPollResults = async (pollId) => { ... };
```

---

## 🎛️ **Panel de Administración**

### Nuevas funcionalidades en Admin
1. **Botón "Crear Encuesta"** junto a "Crear Concurso"
2. **Lista de encuestas activas/pasadas**
3. **Resultados en tiempo real** con gráficos
4. **Botón "Crear Concurso con Ganador"** cuando poll termine

### Flujo Admin:
```
1. Admin → "Crear Encuesta para [Mes]"
2. Agregar 3-5 opciones de prompts
3. Establecer fecha límite
4. Publicar encuesta
5. Monitorear resultados
6. Al terminar → "Crear Concurso" con prompt ganador
```

---

## 🔍 **Lógica de Detección**

### En NextContestPreview:
```javascript
// 1. Verificar si hay poll activa para siguiente mes
const activePoll = await getActivePoll();

// 2. Si hay poll activa:
if (activePoll && activePoll.status === 'active') {
  return <PollPreview poll={activePoll} />;
}

// 3. Si no hay poll, mostrar nextContest normal:
return <NextContestPreview nextContest={nextContest} />;
```

---

## 📱 **Experiencia de Usuario**

### Durante Encuesta Activa:
- **Landing page:** Muestra PollPreview donde normalmente está NextContest
- **Mensaje claro:** "¡Ayuda a elegir el prompt para [Mes]!"
- **Opciones atractivas:** Cada prompt con título y descripción
- **Un voto:** Sistema simple, un voto por usuario
- **Tiempo límite:** Contador regresivo hasta cierre

### Después de Votar:
- **Confirmación:** "¡Gracias por votar!"
- **Sin resultados:** Mantener suspense hasta que termine
- **Opción de cambiar voto:** Opcional (configurable)

### Cuando Poll Termina:
- **Automático:** Se oculta la encuesta
- **Admin crea concurso:** Con prompt ganador
- **NextContest normal:** Aparece con prompt elegido

---

## 🚀 **Plan de Implementación**

### Fase 1: Base de Datos
- [ ] Crear tablas `polls`, `poll_options`, `poll_votes`
- [ ] Configurar permisos RLS
- [ ] Funciones básicas de Supabase

### Fase 2: Componentes Frontend
- [ ] Crear `PollPreview.jsx`
- [ ] Modificar `NextContestPreview.jsx`
- [ ] Integrar con GlobalAppContext

### Fase 3: Panel Admin
- [ ] Crear `PollAdminPanel.jsx`
- [ ] Integrar en dashboard admin
- [ ] Funcionalidad de crear/gestionar polls

### Fase 4: Testing & Polish
- [ ] Probar flujo completo
- [ ] Ajustar diseño y UX
- [ ] Optimizar rendimiento

---

## 💡 **Casos de Uso Futuros**

### Más allá de prompts:
- **Votación de temas:** Ficción vs. no ficción
- **Votación de formatos:** Poesía vs. prosa
- **Votación de reglas:** Límite de palabras
- **Votación de premios:** Qué tipo de reconocimiento
- **Votación de fechas:** Cuándo hacer eventos especiales

### Flexibilidad total:
- **Cualquier mes:** No limitado a temporadas específicas
- **Múltiples opciones:** 2-10 opciones por poll
- **Configurable:** Tiempo límite, tipo de votación, etc.

---

## 🔐 **Consideraciones de Seguridad**

- **Un voto por usuario:** Constraint de BD + validación frontend
- **Solo usuarios autenticados:** Verificación obligatoria
- **No manipulación:** Votos inmutables una vez enviados
- **Admin only:** Solo admins pueden crear/gestionar polls
- **Logs:** Registro de todas las acciones admin

---

## 📊 **Métricas y Analytics**

### Métricas a trackear:
- **Participación:** % de usuarios que votan
- **Timing:** Cuándo votan (inmediato vs. último momento)
- **Distribución:** Qué tan reñida está la votación
- **Engagement:** Aumento de visitas durante poll

---

## 🎉 **Beneficios del Sistema**

1. **Engagement:** Usuarios se sienten parte del proceso creativo
2. **Flexibilidad:** Se puede usar cuando quieras, no es obligatorio
3. **Escalabilidad:** Funciona para cualquier tipo de votación futura
4. **Simplicidad:** Aprovecha infraestructura existente
5. **Control:** Admin mantiene control total del proceso

---

*Sistema diseñado para ser implementado gradualmente y usado opcionalmente según las necesidades del mes.*