# Sistema de Likes en Comentarios del Feed

## Resumen
Sistema completo de likes para comentarios del feed con tracking real por usuario y optimistic updates en la UI.

## Fecha de Implementación
Diciembre 30, 2024

---

## Base de Datos

### Nueva Tabla: `feed_comment_likes`
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- comment_id (UUID, FK → feed_story_comments)
- created_at (TIMESTAMPTZ)
- UNIQUE(user_id, comment_id)
```

### Índices Creados
1. `idx_feed_comment_likes_user_id` - Para queries por usuario
2. `idx_feed_comment_likes_comment_id` - Para queries por comentario
3. `idx_feed_comment_likes_user_comment` - Composite para lookups rápidos

### RLS Policies
- **SELECT**: Público (anyone can view)
- **INSERT**: Solo usuarios autenticados pueden dar like
- **DELETE**: Solo pueden eliminar sus propios likes

### Triggers
- `trigger_update_feed_comment_likes_count` - Actualiza automáticamente `feed_story_comments.likes_count` cuando se inserta/elimina un like

---

## Funciones SQL

### 1. `toggle_feed_comment_like(p_user_id, p_comment_id)`
**Propósito**: Toggle automático de like/unlike

**Retorna**:
```json
{
  "action": "liked" | "unliked",
  "likes_count": <número>
}
```

**Uso**:
```sql
SELECT toggle_feed_comment_like(
  'user-uuid',
  'comment-uuid'
);
```

### 2. `check_user_feed_comment_like(p_user_id, p_comment_id)`
**Propósito**: Verificar si un usuario dio like a un comentario

**Retorna**: BOOLEAN

### 3. `get_user_feed_comment_likes_batch(p_user_id, p_comment_ids[])`
**Propósito**: Batch loading de likes de un usuario (performance)

**Retorna**: TABLE(comment_id UUID)

**Uso en React**:
```javascript
const { data } = await supabase.rpc('get_user_feed_comment_likes_batch', {
  p_user_id: user.id,
  p_comment_ids: [commentId1, commentId2, ...]
});
```

---

## Frontend (React)

### Archivos Modificados

#### `src/components/feed/FeedCommentsSection.jsx`
**Cambios principales**:
1. Nuevo import: `supabase` para RPC calls
2. Nuevo estado:
   - `userLikes` - Tracking de qué comentarios dio like el usuario
   - `localLikesCount` - Contadores locales para optimistic updates
3. Nuevo `useEffect` - Carga batch de likes al montar/actualizar comentarios
4. Nueva función: `handleToggleLike()` - Optimistic update + RPC call
5. CommentCard actualizado:
   - Nuevo prop: `onLike`, `isLiked`
   - Nuevo botón de like con Heart icon
   - Contador de likes visible

**Pattern de Optimistic Update**:
```javascript
// 1. Update inmediato de UI
setUserLikes(prev => ({ ...prev, [commentId]: !currentlyLiked }));
setLocalLikesCount(prev => ({ ...prev, [commentId]: newCount }));

// 2. RPC call en background
await supabase.rpc('toggle_feed_comment_like', { ... });

// 3. Rollback si falla
catch (err) {
  setUserLikes(prev => ({ ...prev, [commentId]: currentlyLiked }));
  setLocalLikesCount(prev => ({ ...prev, [commentId]: oldCount }));
}
```

---

## Características Implementadas

✅ **Tracking real por usuario** - Cada like queda registrado en BD
✅ **Optimistic updates** - UI se actualiza instantáneamente sin reload
✅ **Batch loading** - Carga eficiente de estado de likes
✅ **Rollback automático** - Si falla la petición, UI revierte cambios
✅ **Contador automático** - Triggers actualizan `likes_count` en `feed_story_comments`
✅ **Mobile responsive** - Botón pequeño y compacto
✅ **Dark mode** - Colores adaptados para tema oscuro
✅ **Indicador visual** - Corazón vacío/lleno según estado de like

---

## Testing

### Verificar en BD
```sql
-- Ver tabla creada
SELECT tablename FROM pg_tables WHERE tablename = 'feed_comment_likes';

-- Ver índices
SELECT indexname FROM pg_indexes WHERE tablename = 'feed_comment_likes';

-- Ver policies
SELECT policyname FROM pg_policies WHERE tablename = 'feed_comment_likes';

-- Ver funciones
SELECT proname FROM pg_proc WHERE proname LIKE '%feed_comment%';

-- Probar función toggle
SELECT toggle_feed_comment_like(
  'tu-user-id',
  'algun-comment-id'
);
```

### Probar en UI
1. ✅ Click en like - corazón se llena inmediatamente
2. ✅ Contador incrementa sin reload
3. ✅ Click again - unlike, corazón se vacía
4. ✅ Contador decrementa
5. ✅ Refresh página - estado de like persiste
6. ✅ Otro usuario puede dar like al mismo comentario
7. ✅ Comentario con 0 likes no muestra número
8. ✅ Funciona en respuestas también

---

## Performance

- **Batch loading**: 1 query para cargar todos los likes de usuario (no N queries)
- **Optimistic updates**: UI instantánea, BD en background
- **Índices apropiados**: Lookups O(1) con composite index
- **Triggers eficientes**: Solo actualizan 1 row por operación

---

## Próximas Mejoras (Out of Scope)

- [ ] Animación al dar like (bounce effect)
- [ ] Ver lista de quiénes dieron like (modal)
- [ ] Notificaciones cuando alguien da like a tu comentario
- [ ] Ordenar comentarios por más likes
- [ ] Analytics de comentarios más populares

---

## Notas Técnicas

1. **¿Por qué UNIQUE constraint?**
   - Previene likes duplicados del mismo usuario
   - Permite usar `ON CONFLICT` en operaciones

2. **¿Por qué triggers?**
   - Mantiene contador sincronizado automáticamente
   - Evita race conditions
   - Garantiza integridad de datos

3. **¿Por qué batch loading?**
   - Evitar N+1 queries
   - Mejor performance con muchos comentarios
   - UX más rápida

4. **¿Por qué optimistic updates?**
   - UX instantánea (como redes sociales modernas)
   - No bloquea UI esperando respuesta de servidor
   - Rollback automático si falla

---

## Archivos del Sistema

**Base de datos**:
- `/database-scripts/migrations/feed_comment_likes.sql` - Migración completa

**Frontend**:
- `/src/components/feed/FeedCommentsSection.jsx` - Componente con likes

**Documentación**:
- Este archivo - Referencia completa del sistema
