# 🚀 Plan de Lanzamiento: Perfiles Públicos & Features de Votación

## 📅 Timing Estratégico

**Momento ideal**: Durante la transición de fase de envíos → votación
**Razón**: Los usuarios querrán completar sus perfiles antes de que sus historias sean vistas públicamente

---

## ✨ Nuevas Features Implementadas

### 1. **Perfiles Públicos de Autor**
- ✅ Biografía personalizada
- ✅ Ubicación/país
- ✅ Redes sociales (Facebook, Instagram, X/Twitter, LinkedIn, YouTube, TikTok, sitio web)
- ✅ Control de privacidad granular
- ✅ Iconos oficiales de TikTok y X (Twitter)
- ✅ Diseño con contraste mejorado sobre gradientes

### 2. **Sistema de Anuncios**
- ✅ Modal de anuncio de features (se muestra una vez por usuario)
- ✅ Prompt de completar perfil (con barra de progreso)
- ✅ Banner superior actualizable
- ✅ Feature flags para activar/desactivar

### 3. **Mejoras UX**
- ✅ Navegación mejorada entre perfiles
- ✅ Enlaces a perfiles de autor en todas las historias
- ✅ Vista previa del perfil público
- ✅ Estadísticas del autor

---

## 🎯 Estrategia de Comunicación

### Canal 1: **Modal de Anuncio** (Primera visita)
**Dónde**: Se muestra en LandingPage al usuario logueado
**Cuándo**: 1.5 segundos después de cargar la página
**Frecuencia**: Una vez por usuario (usa localStorage)
**Contenido**:
- Explicación de perfiles públicos
- Explicación de sistema de lectura
- CTA para completar perfil

### Canal 2: **Prompt en Perfil** (Usuarios con perfil incompleto)
**Dónde**: Página de perfil del usuario (`/profile`)
**Cuándo**: Si falta bio, ubicación o redes sociales
**Frecuencia**: Cada visita hasta completar (dismissible)
**Contenido**:
- Barra de progreso (0-100%)
- Checklist de campos faltantes
- Botón para abrir editor

### Canal 3: **Banner Superior** (Opcional)
**Dónde**: Header de LandingPage
**Cuándo**: Siempre visible (hasta que el usuario lo cierre)
**Contenido**: "✨ ¡Nuevas features! Perfiles públicos y sistema de lectura mejorado"
**Acción**: Botón "Ver Mi Perfil"

---

## 🔧 Configuración para Lanzamiento

### Paso 1: Activar el Feature Flag

En tu archivo `.env` (o `.env.production`), agrega:

\`\`\`bash
# Activar anuncio de features
VITE_SHOW_FEATURE_ANNOUNCEMENT=true
\`\`\`

### Paso 2: Personalizar el Banner (Opcional)

**Archivo**: `src/components/ui/WelcomeBanner.jsx`

**Opciones de mensajes** según la fase del concurso:

\`\`\`jsx
// Durante envíos (preparando votación):
<span>✨ ¡Nuevas features pronto! Completa tu perfil antes de la votación.</span>

// Durante votación:
<span>✨ ¡Nuevas features! Perfiles públicos y sistema de lectura mejorado.</span>

// Después de votación:
<span>✨ Descubre los nuevos perfiles públicos de autor.</span>
\`\`\`

### Paso 3: Timing del Modal

**Archivo**: `src/pages/LandingPage.jsx` (línea ~138)

\`\`\`jsx
// Ajustar el delay del modal (actualmente 1.5 segundos)
const timer = setTimeout(() => {
  setShowFeatureModal(true);
}, 1500); // Cambiar este valor si quieres más/menos delay
\`\`\`

---

## 📊 Estrategia de Rollout

### Opción A: Lanzamiento Gradual (Recomendado)

1. **Día 1-2**: Activar solo para usuarios registrados
   - Modal de anuncio activo
   - Banner visible
   - Prompt de completar perfil

2. **Día 3**: Anuncio en redes sociales
   - Post explicando las nuevas features
   - Screenshots de perfiles públicos
   - Invitación a completar perfiles

3. **Día 5+**: Desactivar modal de anuncio
   - Cambiar `VITE_SHOW_FEATURE_ANNOUNCEMENT=false`
   - Mantener prompt de completar perfil
   - Actualizar banner a otro mensaje

### Opción B: Lanzamiento Completo Inmediato

1. **Deploy con feature flag activado**
2. **Anuncio simultáneo en todos los canales**:
   - Modal en la app
   - Email a usuarios registrados (opcional)
   - Post en redes sociales
   - Actualización del changelog

---

## 🎨 Personalización de Mensajes

### Modal de Anuncio

**Archivo**: `src/components/modals/FeatureAnnouncementModal.jsx`

Personaliza estos textos según tu audiencia:

\`\`\`jsx
// Título principal
<h2>¡Nuevas Features!</h2>

// Descripción de perfiles públicos (línea ~66)
<p>Ahora puedes crear tu perfil de autor...</p>

// Call to Action (línea ~135)
<h4>¡Completa tu perfil ahora!</h4>
<p>Con el próximo reto entrando en fase de votación...</p>
\`\`\`

### Prompt de Completar Perfil

**Archivo**: `src/components/ui/ProfileCompletionPrompt.jsx`

Personaliza el mensaje motivacional (línea ~110):

\`\`\`jsx
<p>💡 <strong>Tip:</strong> Un perfil completo te ayuda a conectar con otros escritores...</p>
\`\`\`

---

## 📈 Métricas a Monitorear

### Semana 1 Post-Lanzamiento

1. **Tasa de Completitud de Perfiles**
   - % usuarios con bio completa
   - % usuarios con ubicación
   - % usuarios con al menos 1 red social

2. **Engagement**
   - Clics en perfiles públicos de autor
   - Tiempo en página de perfil
   - Clics en redes sociales desde perfiles

3. **Conversión**
   - % usuarios que completan perfil después del modal
   - % usuarios que completan perfil después del prompt

### Query SQL para Estadísticas

\`\`\`sql
-- Completitud de perfiles
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 END) as with_bio,
  COUNT(CASE WHEN location IS NOT NULL AND location != '' THEN 1 END) as with_location,
  COUNT(CASE WHEN social_links IS NOT NULL AND jsonb_array_length(social_links::jsonb) > 0 THEN 1 END) as with_social
FROM user_profiles
WHERE created_at >= NOW() - INTERVAL '7 days';
\`\`\`

---

## 🔄 Plan de Iteración

### Feedback a Recolectar

1. **¿Los usuarios entienden cómo completar su perfil?**
2. **¿El modal es intrusivo o útil?**
3. **¿Los usuarios encuentran los perfiles públicos de otros autores?**
4. **¿Qué redes sociales se usan más?**

### Ajustes Potenciales

**Si el modal es muy intrusivo**:
- Reducir delay inicial
- Hacerlo más pequeño
- Agregar checkbox "No volver a mostrar"

**Si poca gente completa perfiles**:
- Agregar incentivos (badge especial)
- Destacar perfiles completos en rankings
- Mostrar ejemplos de perfiles bien hechos

**Si mucho engagement en perfiles**:
- Agregar más campos (links a publicaciones)
- Sistema de "seguir" autores
- Notificaciones de nuevas historias de autores favoritos

---

## ✅ Checklist Pre-Lanzamiento

### Técnico
- [ ] Hacer commit de todos los cambios
- [ ] Crear backup de base de datos
- [ ] Verificar que iconos de TikTok/X se muestran correctamente
- [ ] Probar modal en diferentes navegadores
- [ ] Verificar responsive design en móvil
- [ ] Configurar `.env` con feature flag activado

### Contenido
- [ ] Revisar textos del modal
- [ ] Revisar texto del banner
- [ ] Preparar post para redes sociales
- [ ] (Opcional) Preparar email announcement

### Monitoreo
- [ ] Configurar analytics para nuevos eventos
- [ ] Preparar queries SQL para métricas
- [ ] Crear dashboard de seguimiento (opcional)

---

## 🆘 Rollback Plan

Si algo sale mal y necesitas desactivar las features:

### Opción 1: Desactivar Modal y Banner (Rápido)

\`\`\`bash
# En .env
VITE_SHOW_FEATURE_ANNOUNCEMENT=false
\`\`\`

Luego redeploy. Los perfiles públicos seguirán funcionando.

### Opción 2: Rollback Completo (Si hay bugs críticos)

\`\`\`bash
git revert <commit-hash>
git push origin main
\`\`\`

Esto deshará todos los cambios.

---

## 📞 Preguntas Frecuentes

### ¿Cuándo desactivar el modal?
**Recomendado**: Después de 5-7 días o cuando >70% de usuarios activos lo hayan visto.

### ¿El prompt de completar perfil es molesto?
No, porque:
1. Solo se muestra si el perfil está incompleto
2. Es dismissible (se puede cerrar)
3. Solo aparece en la página de perfil (no interrumpe la navegación)

### ¿Qué pasa si un usuario no quiere perfil público?
Todo es opcional. Los controles de privacidad permiten:
- Ocultar bio
- Ocultar ubicación
- Ocultar redes sociales
- Los usuarios pueden dejar campos vacíos

### ¿Cómo saber si está funcionando?
Revisa:
1. localStorage del navegador (debe tener `feature_announcement_perfiles_<userId>`)
2. Consola del navegador (no debe haber errores)
3. Vista de perfil público (`/author/<userId>`)

---

## 🎉 Post-Lanzamiento

### Días 1-3: Observación Activa
- Monitorear errores en Sentry/logs
- Responder feedback de usuarios
- Ajustar textos si hay confusión

### Semana 1: Primera Iteración
- Analizar métricas
- Ajustar feature flag si es necesario
- Preparar mejoras basadas en feedback

### Mes 1: Evaluación Completa
- Report de adopción de features
- Decisión sobre features permanentes vs temporales
- Planear siguientes mejoras (ej: sistema de seguir autores)

---

**¡Éxito con el lanzamiento! 🚀**
