# Guía de Feature Flags - Letranido

## 🎯 Estado Actual (Octubre 2024)

### Features DESACTIVADAS ❌
Las siguientes features están desactivadas pero el código permanece intacto:

1. **PREMIUM_PLANS** - Sistema de planes premium
2. **PORTFOLIO_STORIES** - Historias libres/portafolio
3. **PREMIUM_EDITOR** - Editor premium avanzado
4. **BETA_ROUTES** - Rutas beta experimentales

**Razón**: Con ~100 usuarios y ~70 activos, el enfoque está en crecer la base de usuarios antes de monetizar.

### Features ACTIVAS ✅
- **FEEDBACK_SYSTEM** - Sistema de feedback de usuarios

## 📂 Archivos Afectados

### Configuración Principal
- **`src/lib/config.js`** - Definición de feature flags

### Componentes que Usan Flags
- `src/pages/LandingPage.jsx` - CTAs de portafolio
- `src/pages/FreeStories.jsx` - Página de historias libres
- `src/components/layout/Layout.jsx` - Links de navegación
- `src/App.jsx` - Rutas protegidas
- `src/pages/UnifiedProfile.jsx` - Tabs de perfil
- `src/components/profile/ProfileTabs.jsx` - Pestañas de perfil
- `src/pages/WritePortfolio.jsx` - Escritura de portafolio
- `src/components/premium/PremiumProfileFields.jsx` - Campos premium

## 🔧 Cómo Reactivar Features

### Método 1: Reactivar TODO (Desarrollo)
En `src/lib/config.js`, cambia:
```javascript
PREMIUM_PLANS: import.meta.env.DEV, // Se activa en desarrollo
PORTFOLIO_STORIES: import.meta.env.DEV, // Se activa en desarrollo
```

### Método 2: Reactivar SOLO en Producción
Usando variables de entorno (`.env.production`):
```env
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_PORTFOLIO=true
VITE_ENABLE_PREMIUM_EDITOR=true
```

### Método 3: Reactivar Permanentemente
En `src/lib/config.js`, cambia:
```javascript
PREMIUM_PLANS: true, // Siempre activo
PORTFOLIO_STORIES: true, // Siempre activo
```

## 📋 Checklist para Lanzar Premium (Futuro)

Cuando decidas reactivar el sistema premium:

### Preparación
- [ ] Base de usuarios alcanzó umbral deseado (~500+ usuarios activos)
- [ ] Sistema de pagos configurado (Stripe/similar)
- [ ] Términos y condiciones actualizados
- [ ] Precios definidos y testeados

### Testing
- [ ] Probar flujo completo de registro premium
- [ ] Verificar funcionalidades exclusivas
- [ ] Testear downgrade/upgrade de planes

### Lanzamiento
- [ ] Anuncio a la comunidad
- [ ] FAQ de premium disponible
- [ ] Soporte preparado para preguntas

### Código
- [ ] Reactivar flags en `config.js`
- [ ] Verificar que todas las rutas premium funcionan
- [ ] Probar en staging antes de producción
- [ ] Deploy gradual (canary release si es posible)

## 🗂️ Código Premium Existente (No Borrar)

El siguiente código está **comentado/desactivado** pero NO eliminado:

### Componentes Premium
- `src/components/premium/PremiumProfileFields.jsx`
- `src/components/ui/PremiumLiteraryEditor.jsx`
- `src/pages/WritePortfolio.jsx`
- `src/pages/FreeStories.jsx`

### Documentación Premium
- `PREMIUM_SYSTEM_README.md`

### Rutas Premium
- `/write/portfolio` - Escritura libre
- `/stories/free` - Historias libres
- `/premium` - Landing de premium (si existe)

## 💡 Beneficios de Este Enfoque

✅ **Código intacto**: Fácil reactivar en el futuro
✅ **App limpia**: Los usuarios no ven features incompletas
✅ **Flexibilidad**: Testear features en desarrollo sin afectar producción
✅ **Documentado**: Futuro tú sabrá qué hacer
✅ **Sin deuda técnica**: No hay código muerto que borrar después

## 🚀 Roadmap Premium (Tentativo)

### Fase 1: Crecimiento (Actual - Q4 2024)
- ❌ Premium desactivado
- ✅ Foco en engagement y retención
- ✅ Implementar perfiles públicos
- ✅ Implementar historias leídas

### Fase 2: Preparación (Q1 2025)
- 🔄 Revisar features premium existentes
- 🔄 Actualizar según feedback de usuarios
- 🔄 Definir pricing final

### Fase 3: Soft Launch (Q2 2025)
- 🔄 Activar premium para beta testers
- 🔄 Ajustar según feedback
- 🔄 Preparar marketing

### Fase 4: Launch Público (Q3 2025)
- 🔄 Activación completa de premium
- 🔄 Campaña de lanzamiento
- 🔄 Monitoreo de métricas

---

**Última actualización**: Octubre 2024
**Decisión tomada por**: Criterio de crecimiento (100 usuarios, 70 activos)
**Próxima revisión**: Cuando se alcancen 500 usuarios activos
