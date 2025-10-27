import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const ExpandableBio = ({ bio, maxLength = 200, mobileMaxLength = 120, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // 640px = breakpoint 'sm' de Tailwind
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Usar límite según el dispositivo
  const currentMaxLength = isMobile ? mobileMaxLength : maxLength;

  // Si la biografía es corta, mostrarla completa sin botón
  if (!bio || bio.length <= currentMaxLength) {
    return <p className={className}>{bio}</p>;
  }

  // Biografía truncada (buscar un punto o espacio para cortar limpiamente)
  const truncatedBio = (() => {
    const substr = bio.substring(0, currentMaxLength);
    const lastSpace = substr.lastIndexOf(" ");
    const lastPeriod = substr.lastIndexOf(".");

    // Preferir cortar en un punto, sino en un espacio
    if (lastPeriod > currentMaxLength - 50) {
      return bio.substring(0, lastPeriod + 1);
    }
    if (lastSpace > currentMaxLength - 50) {
      return bio.substring(0, lastSpace);
    }
    return substr;
  })();

  return (
    <div className="space-y-2">
      <p className={className}>
        {isExpanded ? bio : `${truncatedBio}...`}
      </p>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white transition-colors underline decoration-white/40 hover:decoration-white underline-offset-2"
        aria-label={isExpanded ? "Leer menos" : "Leer más"}
      >
        {isExpanded ? (
          <>
            Leer menos
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Leer más
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};

export default ExpandableBio;
