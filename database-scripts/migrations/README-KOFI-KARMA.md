# Sistema de Karma para Ko-fi Supporters

## Resumen
Los Ko-fi Supporters ahora reciben **+50 karma permanente** cuando se les asigna el badge desde el panel de administración.

## Filosofía del Sistema
- ✅ **Karma permanente**: Una vez donado, el karma nunca se resta
- ✅ **Badge permanente**: Los supporters mantienen su badge indefinidamente
- ✅ **Reconocimiento justo**: El apoyo financiero merece reconocimiento en la comunidad
- ⏰ **Visibilidad diferida**: El karma se reflejará en rankings cuando finalices el próximo concurso

## Cantidad de Karma
- **Ko-fi Supporter Badge**: +50 karma
- Comparable a otros reconocimientos importantes:
  - Ganar concurso: +75 karma
  - Finalista (top 3): +30 karma
  - Historia publicada: +15 karma

## Instalación (Para Ejecutar en Supabase SQL Editor)

### Paso 1: Agregar columna `bonus_karma`
```sql
-- Ejecutar: database-scripts/migrations/add_bonus_karma_column.sql
```
Crea la columna `user_profiles.bonus_karma` para almacenar karma manual.

### Paso 2: Actualizar funciones Ko-fi
```sql
-- Ejecutar: database-scripts/migrations/update_kofi_badge_with_karma.sql
```
Modifica las funciones `assign_kofi_badge_by_email` y `remove_kofi_badge_by_email` para:
- Otorgar +50 karma al asignar badge
- Revertir karma si se remueve badge (solo para errores)

### Paso 3: Karma retroactivo (UNA VEZ)
```sql
-- Ejecutar: database-scripts/migrations/retroactive_kofi_karma.sql
```
Otorga +50 karma a todos los supporters existentes que ya tienen el badge.

### Paso 4: Actualizar código frontend
Los cambios en el código ya están aplicados:
- ✅ `src/utils/karmaCalculator.js` - Incluye bonus_karma en cálculos
- ✅ `src/components/admin/ContestAdminPanel.jsx` - Recalculo de rankings incluye bonus_karma

## Cómo Funciona

### Al Asignar Badge (Desde Panel Admin)
1. Admin ingresa email del supporter en `/admin` → Tab "Ko-fi Supporters"
2. Se asigna badge `kofi_supporter`
3. Se otorga automáticamente +50 karma bonus
4. El karma NO se ve reflejado en rankings públicos todavía

### Cuando Finalices el Próximo Concurso
1. Admin finaliza concurso desde panel admin
2. Sistema recalcula rankings automáticamente
3. **Bonus karma se incluye en el cálculo total**
4. Rankings actualizados muestran el karma de supporters

### Alternativa: Recalcular Rankings Manualmente
Si no quieres esperar a finalizar concurso:
1. Ir a `/admin`
2. Click en "Actualizar Rankings" (botón naranja)
3. Rankings se recalculan inmediatamente incluyendo bonus_karma

## Casos de Uso

### Supporter nuevo (futuro)
```
1. Donación en Ko-fi
2. Admin asigna badge por email
3. Usuario recibe:
   - Badge rosado con shimmer dorado
   - +50 karma (visible al finalizar concurso)
4. Karma es permanente
```

### Supporters existentes (retroactivo)
```
1. Ya tienen badge asignado
2. Ejecutar retroactive_kofi_karma.sql
3. Todos reciben +50 karma
4. Esperar finalización de concurso para ver reflejado
```

### Remover badge (solo errores)
```
1. Admin remueve badge por email
2. Se resta automáticamente -50 karma
3. USAR SOLO si fue error de asignación
4. NO usar si donación fue legítima
```

## Verificación

### Ver karma bonus de un usuario
```sql
SELECT display_name, bonus_karma
FROM user_profiles
WHERE email = 'usuario@ejemplo.com';
```

### Ver todos los supporters y su karma
```sql
SELECT
  up.display_name,
  up.email,
  up.bonus_karma,
  ub.created_at as badge_assigned_at
FROM user_profiles up
JOIN user_badges ub ON up.id = ub.user_id
WHERE ub.badge_id = 'kofi_supporter'
ORDER BY ub.created_at DESC;
```

### Ver ranking con karma total (incluye bonus)
```sql
SELECT
  user_name,
  total_karma,
  position
FROM cached_rankings
ORDER BY position ASC
LIMIT 10;
```

## Futuras Mejoras Sugeridas

### Badge para Supporters Mensuales
Si implementas suscripciones Ko-fi recurrentes:
- Crear badge `kofi_monthly_supporter`
- Karma mensual adicional (+10/mes?)
- Sistema automático vía webhooks de Ko-fi

### Otros Usos de `bonus_karma`
La columna `bonus_karma` puede usarse para:
- Moderadores de la comunidad
- Eventos especiales
- Premios por contribuciones destacadas
- Compensaciones por errores del sistema

## Notas Importantes

⚠️ **El karma de supporters NO aparecerá en rankings hasta:**
- Finalizar el próximo concurso, O
- Recalcular rankings manualmente desde admin

✅ **Esto es intencional** para:
- No afectar concurso en curso
- Mantener consistencia de datos
- Evitar recalculos innecesarios

💡 **Badge permanente**: Una vez donante, siempre donante. El badge reconoce el apoyo histórico.

## Preguntas Frecuentes

**¿Cuándo veré el karma en los rankings?**
Al finalizar el concurso actual o al recalcular rankings manualmente.

**¿El karma se resta si cancela suscripción Ko-fi?**
No. El karma es por el apoyo dado, no por apoyo futuro.

**¿Puedo darle más karma a un supporter?**
Sí, actualiza manualmente `bonus_karma` en la base de datos.

**¿Afecta el concurso actual?**
No. Los cambios de karma se reflejan en el próximo recalculo.

---

**Fecha de implementación**: Octubre 25, 2025
**Versión**: 1.0
**Autor**: Sistema de Karma de Letranido
