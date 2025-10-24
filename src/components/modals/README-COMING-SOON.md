# Modal de Coming Soon - Letranido

## 📋 Descripción
Modal animado que anuncia próximas features a los usuarios, enfatizando que las mejoras vienen del feedback de la comunidad.

## 🎯 Características

### Diseño y UX
- ✅ **🎉 Explosión de confetti** con colores de Letranido al aparecer (canvas-confetti)
- ✅ **📖 Reveal progresivo** de features con animaciones staggered
- ✅ **💫 Animación de pulso sutil** en botón CTA principal
- ✅ **✨ Mini confetti** al hacer clic en "¡Me emociona!"
- ✅ Animación de entrada suave (fade-in + slide-down + scale)
- ✅ Diseño consistente con el branding de Letranido (gradiente indigo-purple)
- ✅ Responsive y accesible
- ✅ Se muestra **solo una vez** por usuario (localStorage)
- ✅ Puede ser cerrado con botón o clic fuera del modal

### Timing de Animaciones
- Modal aparece: 50ms
- Confetti explosion: 300ms después del modal
- Feature 1 reveal: 800ms
- Feature 2 reveal: 1200ms
- Fecha de lanzamiento: 1600ms

### Features Anunciadas
1. **Perfiles Públicos de Autores**
   - Ver todas las historias de cualquier autor
   - Seguir su progreso como escritor
   - Badges, estadísticas y redes sociales

2. **Marcar Historias como Leídas**
   - Organizar lectura durante votaciones
   - No perder el hilo de lo leído

## 📦 Archivos

### Componente Principal
- **Ubicación**: `src/components/modals/ComingSoonModal.jsx`
- **Props**:
  - `isOpen` (boolean): Controla la visibilidad del modal
  - `onClose` (function): Callback cuando se cierra el modal

### Hook Personalizado
- **Ubicación**: `src/hooks/useComingSoonModal.js`
- **Funcionalidad**:
  - Controla cuándo mostrar el modal
  - Maneja localStorage (`letranido_coming_soon_shown_v1`)
  - Delay de 1.5s para mejor UX

### Integración
- **Ubicación**: `src/pages/LandingPage.jsx`
- Se muestra automáticamente en la primera visita

## 🔧 Uso

### Mostrar el Modal
```jsx
import ComingSoonModal from '../components/modals/ComingSoonModal';
import { useComingSoonModal } from '../hooks/useComingSoonModal';

function MyComponent() {
  const { isOpen, closeModal } = useComingSoonModal();

  return <ComingSoonModal isOpen={isOpen} onClose={closeModal} />;
}
```

### Resetear para Volver a Ver (Testing)
```javascript
// En la consola del navegador
localStorage.removeItem('letranido_coming_soon_shown_v1');
// Recargar la página
```

### Actualizar el Copy
Para cambiar el texto cuando lances las features:
1. Editar `ComingSoonModal.jsx`
2. Cambiar la key en `useComingSoonModal.js` a `v2` para que se vuelva a mostrar

## 🎨 Personalización

### Cambiar Features Anunciadas
Edita las secciones en `ComingSoonModal.jsx` (líneas ~67-115):
```jsx
{/* Feature 1: Perfiles Públicos */}
<div className="bg-gradient-to-br from-indigo-50...">
  <h3>Nueva Feature Aquí</h3>
  {/* ... */}
</div>
```

### Cambiar Fecha de Lanzamiento
Línea ~119 en `ComingSoonModal.jsx`:
```jsx
<span className="font-bold text-lg">Lanzamiento: Esta semana</span>
```

### Cambiar Delay de Aparición
En `useComingSoonModal.js`, línea ~21:
```javascript
const timer = setTimeout(() => {
  setIsOpen(true);
}, 1500); // Cambiar este valor (en ms)
```

## 🚀 Próximos Pasos

### Card Permanente en Landing (Opcional)
Si decides implementar la card visual permanente:
1. Crear `ComingSoonCard.jsx`
2. Integrar en `LandingPage.jsx` después del hero
3. Mantener diseño consistente con el modal

### Cuando Lances las Features
1. Cambiar el modal a "¡Ya Disponible!"
2. Actualizar la key de localStorage a `v2`
3. Cambiar CTAs a "Explorar Ahora"

## 📝 Notas Técnicas

- **LocalStorage Key**: `letranido_coming_soon_shown_v1`
- **Versión**: v1 - Octubre 2024
- **Dependencias**: Solo React y Lucide icons (ya en el proyecto)
- **Animaciones**: CSS puro con Tailwind (no requiere librerías adicionales)
