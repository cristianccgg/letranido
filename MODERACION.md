# Sistema de Moderación Automática - Plan de Implementación

## 📋 Resumen
Sistema de moderación automática para historias con mínima intervención manual y sin interrumpir la experiencia del usuario.

## 🎯 Objetivos
- ✅ Automatizar 95% de la moderación
- ✅ No interrumpir al usuario mientras escribe
- ✅ Minimizar trabajo manual del admin
- ✅ Permitir contenido +18 apropiado
- ✅ Bloquear contenido siempre prohibido

## 🔧 Funcionamiento

### Categorías de Contenido

**❌ PROHIBIDO SIEMPRE** (sin importar +18):
- Contenido que involucre menores
- Incitación a violencia real/autolesión
- Doxxing/información personal
- Contenido que incite odio a grupos específicos
- Zoofilia/bestialismo
- Glorificación de violación/abuso no consensual

**⚠️ SOLO PERMITIDO EN +18**:
- Romance explícito/erótico entre adultos
- Lenguaje fuerte/vulgar
- Violencia ficticia en contexto narrativo
- Contenido sexual consensual entre adultos

**🔍 ZONA GRIS** (revisión manual):
- Violencia gráfica extrema sin propósito narrativo
- Romanticización de relaciones abusivas
- Contenido borderline

### Flujo de Moderación

```javascript
// Al publicar historia:
1. Usuario marca o no marca como +18
2. Sistema analiza texto automáticamente
3. Aplica lógica de decisión:

if (contenidoProhibidoSiempre) {
  return RECHAZAR + mensaje específico
}

if (!marcado18 && contieneContenidoAdulto) {
  return SUGERIR_MARCAR_18
}

if (contenidoZonaGris) {
  return ENVIAR_A_REVISION_MANUAL
}

return APROBAR_Y_PUBLICAR
```

### Sistema de Puntuación
- **0-49 puntos**: ✅ Publica automáticamente
- **50-79 puntos**: ⚠️ Publica + notifica admin después  
- **80+ puntos**: 🔍 Requiere revisión manual
- **Contenido prohibido**: ❌ Rechaza inmediatamente

## 🛠 Implementación Técnica

### Bibliotecas a usar:
- `bad-words` (JavaScript) - filtro de palabrotas
- `profanity-js` - detección de contenido inapropiado
- Expresiones regulares personalizadas

### Ubicación del código:
- Crear: `src/utils/moderacion.js`
- Integrar en: formulario de publicación de historias
- Dashboard admin: nueva sección para revisiones manuales

### Base de datos:
- Tabla para historias flaggeadas
- Log de decisiones de moderación
- Estadísticas de moderación

## 📊 Dashboard Admin

### Opciones de revisión manual:
1. **✅ APROBAR** - Publicar inmediatamente
2. **❌ RECHAZAR** - Bloquear + notificar usuario con razón
3. **⚠️ APROBAR CON ADVERTENCIA** - Publicar + advertir usuario
4. **✏️ SOLICITAR EDICIÓN** - Pedir cambios específicos

### Notificaciones admin:
- Resumen semanal de moderación
- Solo casos dudosos (muy pocos)
- Estadísticas automáticas

## 🚀 Fases de Implementación

### Fase 1: Sistema básico
- Filtros de palabras prohibidas
- Validación al publicar
- Mensajes básicos al usuario

### Fase 2: Sistema inteligente
- Análisis de contexto
- Sistema de puntuación
- Dashboard de revisión

### Fase 3: Mejoras
- Machine learning básico
- Reportes de usuarios
- Estadísticas avanzadas

## 📝 Notas Importantes
- El usuario marca +18 al momento de enviar la historia
- La moderación ocurre solo al publicar (no mientras escribe)
- Respuesta inmediata: publica o rechaza sin demoras
- El 95% debe ser automático
- Solo contenido realmente dudoso llega a revisión manual

---
**Creado el:** 22/08/2025
**Estado:** Pendiente de implementación
**Prioridad:** Media