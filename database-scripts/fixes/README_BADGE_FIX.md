# Fix: Badge "Ganador Veterano" Asignado Incorrectamente

## 🐛 Problema Identificado

**Reportado**: Diciembre 21, 2024

Un usuario reportó que al enviar su historia (5ta historia, por lo que recibió correctamente el badge "Escritor Constante"), también recibió incorrectamente el badge "Ganador Veterano" (Escritor Veterano).

## 🔍 Análisis del Bug

### Causa Raíz

La función SQL `check_and_award_badges()` en `badges_migration.sql` calcula `contest_wins` de forma incorrecta:

```sql
-- ❌ CÓDIGO INCORRECTO (línea 74-76)
SELECT COUNT(*) INTO contest_wins
FROM public.stories
WHERE user_id = target_user_id AND is_winner = true;
```

**Problema**: Este query cuenta TODAS las historias con `is_winner = true`, que incluye:
- 1er lugar (`winner_position = 1`)
- 2do lugar (`winner_position = 2`)
- 3er lugar (`winner_position = 3`)

### Impacto

El badge "Ganador Veterano" (`contest_winner_veteran`) se define como:
- **Criterio correcto**: 2+ victorias en PRIMER lugar
- **Criterio aplicado (incorrecto)**: 2+ badges de ganador/finalista (cualquier posición)

Esto significa que usuarios con 2+ posiciones de finalista (2do/3er lugar) reciben incorrectamente el badge de "Ganador Veterano".

### Badges Afectados

- ✅ **"Escritor Constante"** (5 historias): Funciona correctamente
- ❌ **"Ganador Veterano"** (2+ victorias): Se asigna incorrectamente
- ❌ **"Veterano de las Letras"** (15 historias): Este es un badge DIFERENTE, basado en historias publicadas, NO en victorias

**Nota**: Existe confusión en los nombres. Hay DOS badges con "Veterano" en el nombre:
1. `writer_15` = "Veterano de las Letras" (15 historias publicadas) ✅
2. `contest_winner_veteran` = "Ganador Veterano" (2+ victorias en 1er lugar) ❌

## ✅ Solución

### 1. Verificar Usuarios Afectados

Ejecutar en Supabase SQL Editor:

```bash
# Ver el archivo:
database-scripts/fixes/verify_incorrect_veteran_badges.sql
```

Este script te mostrará:
- Usuarios con badge "Ganador Veterano"
- Cuántas victorias reales tienen (1er lugar)
- Cuántos badges de finalista tienen (2do/3er lugar)
- Si el badge fue asignado correctamente o no

### 2. Aplicar el Fix

Ejecutar en Supabase SQL Editor (en orden):

```bash
# Ver el archivo:
database-scripts/fixes/fix_contest_wins_badge_logic.sql
```

Este script:
1. ✅ Actualiza `check_and_award_badges()` para contar solo `winner_position = 1`
2. ✅ Actualiza `award_specific_badge()` para incluir casos de veterano/leyenda
3. ✅ Elimina badges "Ganador Veterano" asignados incorrectamente
4. ✅ Muestra verificación final de usuarios con el badge

### 3. Verificación Post-Fix

Después de aplicar el fix, verificar:

```sql
-- Usuarios con badge "Ganador Veterano" (deben tener 2+ victorias)
SELECT
  up.display_name,
  COUNT(s.id) as first_place_wins
FROM public.user_badges ub
JOIN public.user_profiles up ON ub.user_id = up.id
JOIN public.stories s ON s.user_id = up.id
  AND s.is_winner = true
  AND s.winner_position = 1
WHERE ub.badge_id = 'contest_winner_veteran'
GROUP BY up.id, up.display_name
ORDER BY first_place_wins DESC;
```

Todos deben tener `first_place_wins >= 2`.

## 📋 Archivos Involucrados

### Código Actual (con bug)
- `database-scripts/migrations/badges_migration.sql` (línea 74-76)
- `database-scripts/migrations/badges_migration_simple.sql` (línea 74-76)

### Fix Scripts
- `database-scripts/fixes/verify_incorrect_veteran_badges.sql` - Verificación pre-fix
- `database-scripts/fixes/fix_contest_wins_badge_logic.sql` - Script de corrección

### Código Frontend (OK)
- `src/hooks/useContestFinalization.js` (línea 176-214) - Asignación en finalización de concursos
  - Este código SÍ verifica correctamente `wins_count` y `winner_position = 1`
  - El problema está solo en la función SQL `check_and_award_badges()`

## 🎯 Prevención Futura

### Tests a Agregar

1. **Test de asignación de badges en BD**:
   - Verificar que `check_and_award_badges()` solo cuenta `winner_position = 1`
   - Verificar que finalistas NO reciben badge de veterano

2. **Test de finalización de concursos**:
   - Verificar que solo ganadores de 1er lugar incrementan `wins_count`
   - Verificar que finalistas (2do/3er) NO incrementan `wins_count`

### Documentación

Actualizar documentación para clarificar:
- Diferencia entre "Veterano de las Letras" (historias) y "Ganador Veterano" (victorias)
- Criterios exactos para cada badge
- Qué se considera "victoria" vs "finalista"

## 📝 Definiciones de Badges (Clarificadas)

| Badge ID | Nombre | Criterio | Tipo |
|----------|--------|----------|------|
| `first_story` | Primera Pluma | 1 historia publicada | story_count |
| `writer_5` | Escritor Constante | 5 historias publicadas | story_count |
| `writer_15` | Veterano de las Letras | 15 historias publicadas | story_count |
| `contest_winner` | Campeón del Mes | 1 victoria (1er lugar) | contest_winner |
| `contest_finalist` | Finalista | 1 posición 2do o 3er lugar | contest_winner |
| `contest_winner_veteran` | Ganador Veterano | 2+ victorias (1er lugar) | contest_wins |
| `contest_winner_legend` | Leyenda | 5+ victorias (1er lugar) | contest_wins |

## 🚀 Ejecución del Fix

### Paso a Paso

1. **Backup** (recomendado):
   ```sql
   -- Crear tabla temporal con estado actual
   CREATE TEMP TABLE veteran_badges_backup AS
   SELECT * FROM public.user_badges
   WHERE badge_id = 'contest_winner_veteran';
   ```

2. **Verificar usuarios afectados**:
   ```bash
   Ejecutar: verify_incorrect_veteran_badges.sql
   ```

3. **Aplicar fix**:
   ```bash
   Ejecutar: fix_contest_wins_badge_logic.sql
   ```

4. **Verificar resultado**:
   - Revisar el SELECT final del script de fix
   - Todos los usuarios deben tener `first_place_wins >= 2`

5. **Notificar usuarios afectados** (opcional):
   - Si se removieron badges incorrectos, considerar notificar a los usuarios
   - Explicar que fue un error del sistema y se corrigió

## ✅ Checklist de Verificación

- [ ] Ejecutar `verify_incorrect_veteran_badges.sql`
- [ ] Revisar usuarios afectados
- [ ] Crear backup de `user_badges`
- [ ] Ejecutar `fix_contest_wins_badge_logic.sql`
- [ ] Verificar que todos los usuarios con badge tienen 2+ victorias
- [ ] Probar enviando una historia nueva (verificar que no se asigne badge incorrecto)
- [ ] Actualizar documentación si es necesario
- [ ] Considerar notificar usuarios afectados

## 🔗 Referencias

- Issue reportado: Usuario recibió badge "Ganador Veterano" incorrectamente
- Fecha: Diciembre 21, 2024
- Función afectada: `check_and_award_badges()` en `badges_migration.sql`
- Fix aplicado: Cambiar `is_winner = true` a `is_winner = true AND winner_position = 1`
