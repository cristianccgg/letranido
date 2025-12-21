# Auditoría Completa del Sistema de Badges

**Fecha**: Diciembre 21, 2024
**Motivo**: Bug encontrado en asignación de "Ganador Veterano" - verificar que no existan problemas similares

---

## 🔍 Puntos de Asignación de Badges

### 1. **Al Enviar una Historia** (Automático)
**Ubicación**: [GlobalAppContext.jsx:2231](src/contexts/GlobalAppContext.jsx#L2231)

```javascript
const { data: newBadges, error: badgeError } = await supabase.rpc('check_and_award_badges', {
  target_user_id: state.user.id
});
```

**Función SQL**: `check_and_award_badges(UUID)`

**Badges que asigna**:
- ✅ `first_story` - Primera Pluma (1 historia)
- ✅ `writer_5` - Escritor Constante (5 historias)
- ✅ `writer_15` - Veterano de las Letras (15 historias)
- ⚠️ `contest_winner_veteran` - Ganador Veterano (2+ victorias) - **FIX APLICADO**
- ⚠️ `contest_winner_legend` - Leyenda (5+ victorias) - **Mismo fix aplicado**

**Riesgo**: 🟢 BAJO (después del fix)
- El fix corrige el conteo para usar solo `winner_position = 1`
- Los badges de story_count son seguros (solo cuentan historias publicadas)

---

### 2. **Al Finalizar un Concurso** (Manual por Admin)
**Ubicación**: [useContestFinalization.js:158-214](src/hooks/useContestFinalization.js#L158-L214)

**Función SQL**: `award_specific_badge(UUID, VARCHAR, UUID)`

**Badges que asigna**:
- ✅ `contest_winner` - Campeón del Mes (1er lugar)
- ✅ `contest_finalist` - Finalista (2do/3er lugar)
- ✅ `contest_winner_veteran` - Ganador Veterano (2+ victorias en 1er lugar)
- ✅ `contest_winner_legend` - Leyenda (5+ victorias en 1er lugar)

**Lógica de asignación**:
```javascript
// Línea 176-214: Solo para posición 1
if (position === 1) {
  const { data: updatedUser } = await supabase
    .from("user_profiles")
    .select("wins_count")
    .eq("id", winner.user_id)
    .single();

  // Badge veterano: 2+ victorias
  if (updatedUser.wins_count >= 2) {
    await supabase.rpc('award_specific_badge', {
      target_user_id: winner.user_id,
      badge_type: 'contest_winner_veteran',
      contest_id: contestId
    });
  }

  // Badge leyenda: 5+ victorias
  if (updatedUser.wins_count >= 5) {
    await supabase.rpc('award_specific_badge', {
      target_user_id: winner.user_id,
      badge_type: 'contest_winner_legend',
      contest_id: contestId
    });
  }
}
```

**Riesgo**: 🟢 BAJO
- Esta lógica ES CORRECTA
- Solo verifica `wins_count` que solo se incrementa para `winner_position = 1`
- Solo se ejecuta para posición 1

---

## 📊 Tipos de Badges y Sus Criterios

### Badges de Historias Publicadas (`story_count`)
| Badge ID | Nombre | Threshold | Riesgo |
|----------|--------|-----------|--------|
| `first_story` | Primera Pluma | 1 | 🟢 Bajo |
| `writer_5` | Escritor Constante | 5 | 🟢 Bajo |
| `writer_15` | Veterano de las Letras | 15 | 🟢 Bajo |

**Query usado**:
```sql
SELECT COUNT(*) FROM stories
WHERE user_id = target_user_id AND published_at IS NOT NULL
```

**Seguridad**: ✅ Correcto - Solo cuenta historias realmente publicadas

---

### Badges de Victorias (`contest_wins`)
| Badge ID | Nombre | Threshold | Riesgo |
|----------|--------|-----------|--------|
| `contest_winner_veteran` | Ganador Veterano | 2 | 🟡 **CORREGIDO** |
| `contest_winner_legend` | Leyenda | 5 | 🟡 **CORREGIDO** |

**Query ANTES del fix** ❌:
```sql
SELECT COUNT(*) FROM stories
WHERE user_id = target_user_id AND is_winner = true
-- Problema: Contaba 1º, 2º y 3º lugar
```

**Query DESPUÉS del fix** ✅:
```sql
SELECT COUNT(*) FROM stories
WHERE user_id = target_user_id
  AND is_winner = true
  AND winner_position = 1
-- Correcto: Solo cuenta primer lugar
```

**Seguridad**: ✅ Corregido

---

### Badges de Ganadores Individuales (`contest_winner`)
| Badge ID | Nombre | Asignación | Riesgo |
|----------|--------|------------|--------|
| `contest_winner` | Campeón del Mes | Manual (finalización) | 🟢 Bajo |
| `contest_finalist` | Finalista | Manual (finalización) | 🟢 Bajo |

**Seguridad**: ✅ Correcto - Asignación manual por admin al finalizar concurso

---

### Badges Especiales
| Badge ID | Nombre | Asignación | Riesgo |
|----------|--------|------------|--------|
| `kofi_supporter` | Ko-fi Supporter | Manual | 🟢 Bajo |

**Seguridad**: ✅ Correcto - Asignación manual por admin

---

## 🔒 Controles de Seguridad

### 1. **Constraint UNIQUE en user_badges**
```sql
UNIQUE(user_id, badge_id)
```
- ✅ Previene badges duplicados
- Un usuario NO puede tener el mismo badge múltiples veces

### 2. **RLS Policies**
```sql
-- Solo el sistema puede insertar badges
CREATE POLICY "user_badges_insert_system" ON public.user_badges
  FOR INSERT WITH CHECK (false);
```
- ✅ Usuarios NO pueden auto-asignarse badges
- Solo funciones `SECURITY DEFINER` pueden insertar

### 3. **ON CONFLICT en check_and_award_badges**
```sql
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (target_user_id, badge_record.id)
ON CONFLICT (user_id, badge_id) DO NOTHING;
```
- ✅ Llamadas múltiples no causan duplicados
- Idempotencia garantizada

---

## ⚠️ Riesgos Identificados y Solucionados

### ❌ Bug Original: Ganador Veterano
**Problema**: Se asignaba a usuarios con 2+ badges de ganador/finalista, no 2+ victorias
**Causa**: Query contaba `is_winner = true` sin verificar `winner_position = 1`
**Solución**: ✅ Aplicada (Diciembre 21, 2024)
**Impacto**: 1 usuario afectado (badge removido)

### ✅ Sin Otros Problemas Detectados
Los badges de `story_count` funcionan correctamente porque:
- Solo cuentan `published_at IS NOT NULL`
- No dependen de posiciones o estados complejos
- La lógica es simple y directa

---

## 🧪 Scripts de Verificación

### 1. Verificar todos los badges (Completo)
```bash
database-scripts/fixes/verify_all_badges_comprehensive.sql
```
Ejecutar este script para obtener:
- Resumen de todos los badges
- Usuarios con badges incorrectos de story_count
- Usuarios con badges incorrectos de contest_wins
- Resumen ejecutivo

### 2. Verificar solo badges de victorias
```bash
database-scripts/fixes/verify_incorrect_veteran_badges.sql
```

### 3. Aplicar correcciones
```bash
database-scripts/fixes/fix_contest_wins_badge_logic.sql
```

---

## 📋 Checklist de Verificación Periódica

Ejecutar mensualmente para asegurar integridad:

- [ ] Verificar badges de story_count (query 6 del script comprehensive)
- [ ] Verificar badges de contest_wins (query 7 del script comprehensive)
- [ ] Verificar que no hay duplicados (gracias a UNIQUE constraint)
- [ ] Verificar que todos los ganadores tienen sus badges
- [ ] Verificar que no hay badges huérfanos (usuarios eliminados)

---

## 🚀 Recomendaciones Futuras

### 1. **Tests Automatizados**
Crear tests unitarios para:
- `check_and_award_badges()` - verificar que solo asigna badges correctos
- `award_specific_badge()` - verificar que solo admite tipos válidos
- Conteo de victorias - verificar que solo cuenta `winner_position = 1`

### 2. **Logging Mejorado**
Agregar logging a nivel BD:
```sql
-- Ejemplo: Tabla de audit log para badges
CREATE TABLE badge_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  badge_id VARCHAR,
  action VARCHAR, -- 'awarded', 'removed'
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Dashboard de Admin**
Panel para visualizar:
- Badges asignados hoy
- Usuarios cercanos a ganar badges (ej: 4 historias, a 1 de "Escritor Constante")
- Badges incorrectos detectados automáticamente

### 4. **Notificaciones de Badges**
Implementar UI para mostrar:
- Modal cuando se gana un badge nuevo
- Lista de badges en perfil de usuario
- Progreso hacia próximo badge

---

## ✅ Estado Actual del Sistema

**Después del fix aplicado (Diciembre 21, 2024)**:

- ✅ Función `check_and_award_badges()` corregida
- ✅ Función `award_specific_badge()` actualizada
- ✅ Badge incorrecto de Pareidolico removido
- ✅ Badge correcto de Shiogen preservado
- ✅ Sistema funcionando correctamente

**Confianza**: 🟢 ALTA
- Todos los tipos de badges verificados
- Lógica correcta después del fix
- Controles de seguridad en su lugar
- Scripts de verificación disponibles

---

## 📞 Contacto para Reportes

Si detectas un problema con badges:
1. Ejecutar `verify_all_badges_comprehensive.sql`
2. Documentar el problema con screenshots
3. Reportar con detalles específicos del usuario afectado
4. No modificar badges manualmente sin verificar el script de fix

**Mantenedor**: Cristian G.
**Última actualización**: Diciembre 21, 2024
