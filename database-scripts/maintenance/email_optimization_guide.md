# Guía de Optimización de Emails - Letranido

## 🎯 Objetivo
Reducir la lista de destinatarios de emails masivos de **107 usuarios** a **menos de 100** sin eliminar cuentas ni perder usuarios valiosos.

## 📋 Proceso Paso a Paso

### Paso 1: Análisis Inicial (OBLIGATORIO)
```bash
# Ejecutar en Supabase SQL Editor
/database-scripts/analytics/analyze_user_engagement.sql
```

**¿Qué te dirá este script?**
- Cuántos usuarios realmente participan vs cuántos están inactivos
- Segmentación clara: escritores activos, participantes, inactivos totales
- Cuántos emails ahorrarías desactivando inactivos
- Lista de usuarios prioritarios (NUNCA desactivar)

**Ejemplo de resultado esperado:**
```
Segmento                           | Usuarios | Con emails activos
-----------------------------------|----------|-------------------
🎖️ Ko-fi Supporter                |    2     |    2
✍️ Escritor activo (3+ historias) |   15     |   15
📝 Escritor (1-2 historias)       |   25     |   23
👍 Participante activo            |   10     |    9
👀 Participante ocasional         |   20     |   18
😴 Sin actividad                  |   35     |   30
```

### Paso 2: Identificar Usuarios a Desactivar
```bash
# Ejecutar las queries 1 y 2 de:
/database-scripts/maintenance/disable_inactive_users_emails.sql
```

**Criterios para desactivar:**
- ✅ NO ha publicado ninguna historia
- ✅ NO ha votado nunca
- ✅ NO ha comentado nunca
- ✅ NO es Ko-fi supporter
- ✅ Tiene email configurado (para que el cambio tenga efecto)

**IMPORTANTE:** Revisa manualmente la lista antes de desactivar. Puede haber usuarios que:
- Se registraron recientemente (< 7 días) y aún no han participado
- Tienen intención de participar pero no lo han hecho

### Paso 3: Estrategia Conservadora (RECOMENDADO)

#### Opción A: Desactivar solo usuarios antiguos inactivos
```sql
-- Solo usuarios registrados hace MÁS de 30 días sin actividad
UPDATE user_profiles up
SET
  email_notifications = false,
  contest_notifications = false,
  general_notifications = false,
  newsletter_contests = false,
  updated_at = NOW()
WHERE
  -- Inactivos (sin historias, votos, comentarios)
  NOT EXISTS (SELECT 1 FROM stories WHERE user_id = up.id AND published_at IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM votes WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM comments WHERE user_id = up.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = up.id AND badge_id = 'kofi_supporter')
  -- Registrados hace más de 30 días
  AND created_at < NOW() - INTERVAL '30 days'
  -- Tienen email activo
  AND email IS NOT NULL
  AND email != ''
  AND email_notifications = true;
```

#### Opción B: Desactivar TODOS los inactivos (más agresivo)
```sql
-- Descomentar el UPDATE en disable_inactive_users_emails.sql (paso 3)
```

### Paso 4: Verificar Resultados
```sql
-- Contar cuántos usuarios ahora recibirán emails
SELECT COUNT(*) as usuarios_activos
FROM user_profiles
WHERE email IS NOT NULL
  AND email != ''
  AND email_notifications = true;
```

**Meta:** Deberías quedar con **50-70 usuarios** con emails activos (dependiendo de tu comunidad).

### Paso 5: Comunicación (OPCIONAL pero recomendado)

#### Email de Aviso (antes de desactivar)
Puedes enviar un email manual a los inactivos avisándoles:

**Asunto:** "¿Sigues interesado en Letranido?"

**Contenido sugerido:**
```
Hola [nombre],

Notamos que aún no has participado en Letranido publicando historias,
votando o comentando.

Para optimizar nuestras comunicaciones, desactivaremos las notificaciones
de tu cuenta en 7 días. Si quieres seguir recibiendo emails sobre nuestros
retos mensuales, simplemente:

1. Publica tu primera historia 📝
2. Vota por historias que te gusten ❤️
3. O actualiza tus preferencias en: [link a /preferences]

¡Esperamos verte participando pronto!

El equipo de Letranido
```

**Pros:** Transparencia, posible reactivación de usuarios dormidos
**Contras:** Requiere trabajo extra, puede generar bajas voluntarias

### Paso 6: Monitoreo Continuo

Crea un cron job o recordatorio mensual para ejecutar:

```sql
-- Reactivar automáticamente usuarios que empiecen a participar
UPDATE user_profiles up
SET
  email_notifications = true,
  contest_notifications = true,
  updated_at = NOW()
WHERE
  email_notifications = false
  AND (
    -- Publicó historia en los últimos 7 días
    EXISTS (
      SELECT 1 FROM stories
      WHERE user_id = up.id
      AND published_at > NOW() - INTERVAL '7 days'
    )
    -- O votó recientemente
    OR EXISTS (
      SELECT 1 FROM votes
      WHERE user_id = up.id
      AND created_at > NOW() - INTERVAL '7 days'
    )
    -- O comentó recientemente
    OR EXISTS (
      SELECT 1 FROM comments
      WHERE user_id = up.id
      AND created_at > NOW() - INTERVAL '7 days'
    )
  );
```

## 🔒 Políticas de Protección

### NUNCA desactivar emails de:
1. ✅ Ko-fi supporters (¡apoyaron económicamente!)
2. ✅ Usuarios que hayan publicado al menos 1 historia
3. ✅ Usuarios con 3+ votos (participación activa)
4. ✅ Usuarios con 2+ comentarios (engagement)
5. ✅ Usuarios registrados hace menos de 7 días (darles tiempo)

### Desactivar con cuidado:
- ⚠️ Usuarios registrados hace 8-30 días sin actividad (pueden estar conociendo)
- ⚠️ Usuarios que solo votaron 1-2 veces (baja participación)

### Desactivar sin problema:
- ✅ Usuarios registrados hace 30+ días sin ninguna actividad
- ✅ Usuarios registrados hace 60+ días (más seguro)
- ✅ Usuarios con email inválido o bounces recurrentes

## 📊 Métricas Esperadas

### Antes de optimizar:
- **Total usuarios registrados:** ~107
- **Con emails activos:** ~107
- **Emails por envío masivo:** 107 ❌ (excede límite de 100)

### Después de optimizar (conservador):
- **Total usuarios registrados:** ~107 (sin cambios)
- **Con emails activos:** ~60-70
- **Emails por envío masivo:** 60-70 ✅ (dentro del límite)
- **Espacio para crecer:** 30-40 nuevos usuarios antes de volver al límite

### Después de optimizar (agresivo):
- **Total usuarios registrados:** ~107
- **Con emails activos:** ~50-60
- **Emails por envío masivo:** 50-60 ✅
- **Espacio para crecer:** 40-50 nuevos usuarios

## 🎓 Mejores Prácticas a Futuro

### 1. Onboarding más efectivo
- Enviar 1-2 emails de bienvenida con CTAs claras
- Recordatorio a los 7 días si no han participado
- Desactivar automáticamente a los 30 días sin actividad

### 2. Segmentación de emails
- **Esenciales:** Solo resultados de retos (todos los activos)
- **Generales:** Tips, updates (solo usuarios con 2+ historias)
- **Marketing:** Newsletter (opt-in explícito)

### 3. Re-engagement campaigns (trimestral)
- Email a inactivos: "Te extrañamos, vuelve con este prompt especial"
- Si no responden en 30 días → desactivar
- Mantener base de emails limpia y comprometida

## 🚨 Troubleshooting

### "¿Qué pasa si desactivo a alguien por error?"
- Sus historias, votos y comentarios siguen intactos
- Pueden reactivar emails desde `/preferences`
- Puedes reactivarlos manualmente con UPDATE

### "¿Cómo identifico emails bounced/inválidos?"
- Revisa logs de tu servicio de email (Resend, etc.)
- Marca esos emails en BD con flag `email_valid = false`
- Desactiva automáticamente notificaciones para emails inválidos

### "¿Esto afecta la privacidad/GDPR?"
- ❌ NO eliminas datos personales
- ✅ Solo desactivas notificaciones (legítimo interés)
- ✅ Usuarios pueden reactivar cuando quieran
- ✅ Cumple con GDPR/CAN-SPAM

## 📝 Checklist de Ejecución

- [ ] 1. Ejecutar `analyze_user_engagement.sql` completo
- [ ] 2. Revisar segmentación y números
- [ ] 3. Ejecutar queries 1 y 2 de `disable_inactive_users_emails.sql`
- [ ] 4. Revisar manualmente la lista de usuarios a desactivar
- [ ] 5. (Opcional) Enviar email de aviso con 7 días de anticipación
- [ ] 6. Ejecutar UPDATE de desactivación (query 3)
- [ ] 7. Verificar conteo final de usuarios activos
- [ ] 8. Hacer prueba de envío de email masivo
- [ ] 9. Documentar cuántos usuarios se desactivaron
- [ ] 10. Programar revisión mensual para reactivar participantes

## 🎯 Resultado Final Esperado

**De:** 107 usuarios → 107 emails por envío ❌
**A:** 107 usuarios → 60-70 emails por envío ✅

**Beneficios:**
- ✅ Dentro del límite de 100 emails/día
- ✅ Espacio para crecer 30-40 nuevos usuarios
- ✅ Lista más comprometida (mejor engagement)
- ✅ Menores costos de email a futuro
- ✅ Sin pérdida de datos ni usuarios
- ✅ Usuarios pueden reactivarse en cualquier momento

---

**Última actualización:** Enero 2026
**Versión:** 1.0
**Autor:** Claude Code para Letranido
