# TODO: Arreglar Lógica de Karma Rankings

## Problema Identificado

El sistema de karma está contando **acciones históricas** en lugar del **estado actual**:

- ✅ **Likes recibidos**: Funciona correctamente (usa `likes_count` actual)
- ❌ **Votos dados**: Cuenta TODOS los votos históricos, incluidos los retirados
- ❌ **Comentarios**: Cuenta TODOS los comentarios históricos, incluidos los borrados

## Cambios Requeridos

### 1. Arreglar función `loadRealTimeRankings()` 
**Archivo:** `/src/components/ui/KarmaRankingsSidebar.jsx`
**Líneas:** 122-238

#### Votos (líneas 144-171):
```javascript
// ACTUAL (incorrecto):
const { data: rpcVotes, error: rpcError } = await supabase
  .rpc('get_all_votes_for_rankings'); // Incluye votos retirados

// CAMBIAR A:
// Solo obtener votos activos que existen en la tabla votes
// (los retirados ya fueron eliminados de la DB)
```

#### Comentarios (líneas 176-182):
```javascript
// ACTUAL (ya está correcto porque se eliminan completamente):
const { data: comments, error: commentsError } = await supabase
  .from('comments')
  .select('user_id, story_id, created_at')
  .not('user_id', 'is', null)
  .not('story_id', 'is', null);
```

### 2. Verificar función RPC `get_all_votes_for_rankings`
**Base de datos:** Verificar que esta función solo devuelva votos activos

### 3. Aplicar la misma lógica al proceso manual de admin
Cuando hagas la llamada manual para generar rankings al finalizar concursos, usar la misma lógica corregida.

## Cuándo Hacer los Cambios

🔥 **IMPORTANTE**: Hacer estos cambios **DESPUÉS** de que termine el concurso actual para no afectar los rankings durante la votación.

## Archivos a Modificar

1. `src/components/ui/KarmaRankingsSidebar.jsx` - función `loadRealTimeRankings()`
2. Función RPC `get_all_votes_for_rankings` (verificar en base de datos)
3. Proceso manual de admin para generar rankings

## Resultado Esperado

Después del arreglo:
- ✅ Karma por votos: Solo cuenta votos que realmente existen
- ✅ Karma por comentarios: Solo cuenta comentarios que realmente existen  
- ✅ Karma por likes: Sigue funcionando correctamente
- ✅ Sistema de cache: Se mantiene igual
- ✅ Llamada manual de admin: Usa lógica corregida

---

**Creado**: 2025-08-28  
**Estado**: Pendiente hasta finalizar concurso actual