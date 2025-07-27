const SkeletonLoader = ({ 
  className = "", 
  variant = "text", // "text", "card", "story", "avatar", "button"
  lines = 3,
  width = "full",
  height = "auto"
}) => {
  
  const getBaseClasses = () => {
    return "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded";
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "card":
        return "h-48 w-full rounded-lg";
      case "story":
        return "h-32 w-full rounded-lg";
      case "avatar":
        return "h-10 w-10 rounded-full";
      case "button":
        return "h-10 w-24 rounded-lg";
      case "text":
      default:
        return "h-4 rounded";
    }
  };

  const getWidthClass = () => {
    if (typeof width === "string") {
      switch (width) {
        case "full": return "w-full";
        case "3/4": return "w-3/4";
        case "1/2": return "w-1/2";
        case "1/3": return "w-1/3";
        case "1/4": return "w-1/4";
        default: return "w-full";
      }
    }
    return "";
  };

  // Para variantes específicas, renderizar directamente
  if (variant !== "text") {
    return (
      <div 
        className={`${getBaseClasses()} ${getVariantClasses()} ${getWidthClass()} ${className}`}
        style={{ 
          height: height !== "auto" ? height : undefined,
          animation: "skeleton-wave 1.5s ease-in-out infinite"
        }}
      />
    );
  }

  // Para texto, renderizar múltiples líneas
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => {
        // Variar el ancho de las líneas para más realismo
        const lineWidth = index === lines - 1 ? "3/4" : "full";
        return (
          <div 
            key={index}
            className={`${getBaseClasses()} ${getVariantClasses()} w-${lineWidth}`}
            style={{ 
              animation: `skeleton-wave 1.5s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        );
      })}
    </div>
  );
};

// Skeleton específico para cards de historias
const StoryCardSkeleton = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header con avatar y autor */}
      <div className="flex items-center gap-3 mb-4">
        <SkeletonLoader variant="avatar" />
        <div className="flex-1">
          <SkeletonLoader variant="text" lines={1} width="1/2" />
          <SkeletonLoader variant="text" lines={1} width="1/3" className="mt-1" />
        </div>
      </div>
      
      {/* Título */}
      <SkeletonLoader variant="text" lines={1} width="3/4" className="mb-3" />
      
      {/* Contenido */}
      <SkeletonLoader variant="text" lines={3} className="mb-4" />
      
      {/* Footer con stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonLoader variant="button" width="1/4" />
          <SkeletonLoader variant="button" width="1/4" />
        </div>
        <SkeletonLoader variant="text" lines={1} width="1/4" />
      </div>
    </div>
  );
};

// Skeleton para estadísticas
const StatsSkeleton = ({ className = "" }) => {
  return (
    <div className={`grid grid-cols-3 gap-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-8 border-2 border-white/20 ${className}`}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="text-center">
          <div className="mb-2">
            <SkeletonLoader variant="text" lines={1} width="1/2" className="mx-auto h-12" />
          </div>
          <SkeletonLoader variant="text" lines={2} width="3/4" className="mx-auto" />
        </div>
      ))}
    </div>
  );
};

// Skeleton para lista de concursos
const ContestListSkeleton = ({ count = 3, className = "" }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          {/* Header del concurso */}
          <div className="flex items-center justify-between mb-4">
            <SkeletonLoader variant="text" lines={1} width="1/3" />
            <SkeletonLoader variant="button" />
          </div>
          
          {/* Descripción */}
          <SkeletonLoader variant="text" lines={2} className="mb-4" />
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            <SkeletonLoader variant="text" lines={1} width="1/4" />
            <SkeletonLoader variant="text" lines={1} width="1/4" />
            <SkeletonLoader variant="text" lines={1} width="1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
export { StoryCardSkeleton, StatsSkeleton, ContestListSkeleton };