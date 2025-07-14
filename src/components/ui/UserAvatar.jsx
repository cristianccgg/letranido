// components/ui/UserAvatar.jsx - Avatar reutilizable con iniciales y colores únicos
import React from 'react';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  className = '',
  showTooltip = false 
}) => {
  // Generar iniciales inteligentes del nombre de escritor
  const getUserInitials = (name) => {
    if (!name) return "U";
    
    const cleanName = name.trim();
    
    // Si tiene espacios, tomar primera letra de cada palabra
    if (cleanName.includes(" ")) {
      return cleanName
        .split(" ")
        .map(word => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    
    // Si no tiene espacios pero tiene más de 1 caracter
    if (cleanName.length >= 2) {
      // Buscar mayúsculas para nombres como "EscritorMisterioso" -> "EM"
      const upperCases = cleanName.match(/[A-Z]/g);
      if (upperCases && upperCases.length >= 2) {
        return upperCases.slice(0, 2).join("");
      }
      
      // Si no hay mayúsculas, tomar primera y última letra
      return (cleanName[0] + cleanName[cleanName.length - 1]).toUpperCase();
    }
    
    // Si solo tiene 1 caracter
    return cleanName[0].toUpperCase();
  };

  // Color consistente de la marca (púrpura)
  const getUserColor = () => {
    return "from-primary-500 to-accent-500";
  };

  // Tamaños predefinidos
  const sizes = {
    xs: { container: 'w-6 h-6', text: 'text-xs' },
    sm: { container: 'w-8 h-8', text: 'text-sm' },
    md: { container: 'w-10 h-10', text: 'text-base' },
    lg: { container: 'w-12 h-12', text: 'text-lg' },
    xl: { container: 'w-16 h-16', text: 'text-xl' },
    '2xl': { container: 'w-20 h-20', text: 'text-2xl' }
  };

  const userInitials = getUserInitials(user?.name || user?.display_name);
  const userColor = getUserColor();
  const sizeClasses = sizes[size] || sizes.md;

  const avatar = (
    <div 
      className={`${sizeClasses.container} bg-gradient-to-br ${userColor} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      title={showTooltip ? user?.name || user?.display_name : undefined}
    >
      <span className={`text-white ${sizeClasses.text} font-bold`}>
        {userInitials}
      </span>
    </div>
  );

  return avatar;
};

export default UserAvatar;