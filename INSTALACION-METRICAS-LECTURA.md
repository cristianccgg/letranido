# Instalación del Sistema de Métricas de Lectura

## Descripción
Este sistema permite a los administradores ver estadísticas detalladas sobre cómo se están distribuyendo las lecturas entre las historias de un reto, para verificar que el sistema de ordenamiento equitativo está funcionando correctamente.

## Archivos Creados

### 1. Migración SQL
**Archivo:** `database-scripts/migrations/reading_metrics_analytics.sql`

Contiene 3 funciones SQL nuevas:
- `get_contest_reading_metrics(p_contest_id)` - Métricas por historia
- `get_contest_reading_summary(p_contest_id)` - Estadísticas agregadas
- `get_reading_distribution(p_contest_id)` - Histograma de distribución

### 2. Componente React
**Archivo:** `src/components/admin/ReadingMetricsPanel.jsx`

Panel administrativo con 3 vistas:
- **Resumen**: Estadísticas generales e índice de equidad
- **Por Historia**: Tabla detallada con lecturas por historia
- **Distribución**: Histograma visual

### 3. Integración en Admin Panel
**Archivo:** `src/components/admin/ContestAdminPanel.jsx` (modificado)

- Nuevo tab "Métricas de Lectura" con icono de libro
- Selector de concurso para analizar diferentes retos

## Instalación

### Paso 1: Ejecutar la Migración SQL

Abre el **SQL Editor** en tu dashboard de Supabase y ejecuta el contenido del archivo:
`database-scripts/migrations/reading_metrics_analytics.sql`

Alternativamente, si tienes acceso directo a la base de datos:
```bash
psql "postgresql://[TU_CONNECTION_STRING]" < database-scripts/migrations/reading_metrics_analytics.sql
```

### Paso 2: Verificar las Funciones

Ejecuta este query en el SQL Editor para verificar que las funciones se crearon correctamente:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%reading%'
ORDER BY routine_name;
```

Deberías ver:
- `get_contest_reading_distribution`
- `get_contest_reading_metrics`
- `get_contest_reading_summary`

### Paso 3: Deploy del Frontend

El código del frontend ya está integrado. Solo necesitas hacer deploy:

```bash
npm run build
git add .
git commit -m "Add reading metrics analytics panel"
git push origin main
```

Vercel desplegará automáticamente los cambios.

## Uso

1. Ve al **Panel de Admin** (`/admin`)
2. Haz clic en el tab **"Métricas de Lectura"**
3. Selecciona un concurso del dropdown
4. Explora las 3 vistas disponibles:
   - **Resumen**: Verás el coeficiente de variación (CV) y estadísticas clave
   - **Por Historia**: Lista detallada con lecturas y votos
   - **Distribución**: Histograma que muestra cuántas historias tienen X lecturas

## Interpretación de Métricas

### Coeficiente de Variación (CV)
Indica qué tan equitativa es la distribución de lecturas:
- **< 30%**: Excelente - Distribución muy equitativa
- **30-50%**: Buena - Distribución aceptable
- **50-70%**: Regular - Algunas historias están siendo ignoradas
- **> 70%**: Baja - Distribución muy desigual, requiere atención

### Alertas
- **Historias sin lecturas**: El sistema te alertará si hay historias que nadie ha leído
- **Lecturas por debajo del promedio**: Se resaltan en naranja/rojo en la tabla

### Distribución
El histograma te permite ver rápidamente:
- Cuántas historias tienen 0 lecturas
- Cuántas tienen 1-5, 6-10, 11-20, etc.
- Si hay outliers (historias con muchas más lecturas que el resto)

## Solución de Problemas

### "No hay datos disponibles"
- Verifica que el concurso tenga historias publicadas
- Verifica que haya usuarios que hayan leído historias en ese concurso

### Error al cargar métricas
- Verifica que las funciones SQL se hayan ejecutado correctamente
- Revisa la consola del navegador para más detalles
- Verifica los permisos de la función (GRANT EXECUTE)

### CV muy alto
Si el coeficiente de variación es muy alto (>70%), considera:
- Verificar que el ordenamiento aleatorio esté funcionando
- Revisar si hay problemas de UX que impidan que usuarios lean todas las historias
- Analizar el tiempo promedio de lectura

## Mantenimiento

Las funciones SQL están optimizadas con:
- Índices en `user_story_reads` (ya existentes)
- CTEs para queries eficientes
- `SECURITY DEFINER` para permisos controlados

No requieren mantenimiento adicional, solo correrán en tiempo real cuando los admins accedan al panel.

## Datos Técnicos

**Tablas utilizadas:**
- `user_story_reads` (principal)
- `stories`
- `user_profiles`
- `votes`

**Permisos requeridos:**
- Usuario debe ser `is_admin: true` en la tabla `user_profiles`
- Las funciones tienen `GRANT EXECUTE ON FUNCTION ... TO authenticated`

---

**Fecha de creación:** Octubre 31, 2024
**Autor:** Sistema de Métricas de Lectura v1.0
