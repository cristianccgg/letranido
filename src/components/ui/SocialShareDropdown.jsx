import React, { useState, useRef, useEffect } from "react";
import { 
  Share2, 
  CheckCircle, 
  Copy,
  ChevronDown,
  X
} from "lucide-react";

const SocialShareDropdown = ({ 
  shareData, 
  className = "", 
  size = "default",
  variant = "story", // "story" o "contest"
  compact = false, // Nueva prop para versión compacta
  direction = "up", // "up", "down", "left"
  minimal = false // Nueva prop para versión sin header
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const dropdownRef = useRef(null);
  const { title, text, url } = shareData;

  // Check if user has used the new share feature
  useEffect(() => {
    const hasUsedNewShare = localStorage.getItem('hasUsedSocialShare');
    if (hasUsedNewShare) {
      setShowBadge(false);
    }
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyToClipboard = async () => {
    console.log('Copiando URL:', url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
      // Mark as used
      localStorage.setItem('hasUsedSocialShare', 'true');
      setShowBadge(false);
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
      // Mark as used
      localStorage.setItem('hasUsedSocialShare', 'true');
      setShowBadge(false);
    }
  };

  const shareToSocial = (platform) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      };

    window.open(urls[platform], '_blank', 'width=600,height=400');
    setIsOpen(false);
    // Mark as used
    localStorage.setItem('hasUsedSocialShare', 'true');
    setShowBadge(false);
  };

  const buttonSizes = {
    small: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    large: "px-5 py-3 text-sm",
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-4 w-4", 
    large: "h-5 w-5",
  };

  const socialIcons = {
    twitter: (
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    facebook: (
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    whatsapp: (
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    telegram: (
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    linkedin: (
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          console.log('Toggle dropdown:', !isOpen);
          setIsOpen(!isOpen);
        }}
        className={`${buttonSizes[size]} ${
          copied
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:scale-105 transition-all duration-300 ease-in-out"
        } rounded-lg flex items-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-700`}
        title={copied ? "¡Enlace copiado!" : `¡Nuevo! Compartir ${variant === "story" ? "historia" : "reto"} en redes sociales`}
      >
        {copied ? (
          <>
            <CheckCircle className={iconSizes[size]} />
            <span>¡Copiado!</span>
          </>
        ) : (
          <>
            <Share2 className={iconSizes[size]} />
            <span>Compartir</span>
            <ChevronDown className={`${iconSizes[size]} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
        
        {/* Nuevo Badge */}
        {showBadge && !copied && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
            ¡Nuevo!
          </span>
        )}
      </button>

      {/* Dropdown Menu - Adaptive Layout */}
      {isOpen && (
        <div className={`absolute bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-dark-600/80 z-[9999] overflow-hidden backdrop-blur-sm ${
          direction === "up" 
            ? "bottom-full right-0 mb-2 max-w-[95vw] -translate-x-1/2 sm:translate-x-0 left-1/2 sm:left-auto" 
            : direction === "down"
            ? "top-full right-0 mt-2 max-w-[95vw] -translate-x-1/2 sm:translate-x-0 left-1/2 sm:left-auto"
            : "top-full right-0 mt-2 max-w-[95vw] sm:right-full sm:top-0 sm:mr-2 sm:max-w-[80vw]"
        } ${
          direction === "left" 
            ? "w-64 sm:w-72" 
            : compact ? 'w-64 sm:w-72' : 'w-72 sm:w-80'
        }`} style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>
          
          {/* Header - Conditional */}
          {!compact && !minimal && direction !== "left" && (
            <div className="px-6 py-4 border-b border-gray-100/70 dark:border-dark-600/70 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-dark-700 dark:via-dark-800 dark:to-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-500" />
                  Compartir {variant === "story" ? "historia" : "reto"}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-dark-400 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Compact header with close button */}
          {compact && !minimal && direction !== "left" && (
            <div className="px-4 py-2 border-b border-gray-100/70 dark:border-dark-600/70 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-dark-700 dark:via-dark-800 dark:to-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-800 dark:text-dark-100">
                  Compartir historia
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-dark-400 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Minimal version - close button in corner */}
          {minimal && (
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-dark-400 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200 cursor-pointer z-10"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Social Media Icons - Ultra Modern Layout */}
          <div className={direction === "left" ? "p-4" : "p-6"}>
            {/* Social Icons Row */}
            <div className={`flex items-center justify-center ${
              direction === "left" 
                ? "gap-1" 
                : `gap-2 sm:gap-3 ${minimal ? '' : 'mb-6'}`
            }`}>
              {/* Twitter/X */}
              <button
                onClick={() => shareToSocial('twitter')}
                className={`group relative rounded-2xl bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 hover:from-sky-100 hover:via-sky-200 hover:to-sky-300 dark:from-sky-900/30 dark:via-sky-800/20 dark:to-sky-700/20 dark:hover:from-sky-800/40 dark:hover:via-sky-700/30 dark:hover:to-sky-600/30 text-sky-600 dark:text-sky-400 transition-all duration-300 hover:shadow-lg cursor-pointer border border-sky-300/60 dark:border-sky-600/40 hover:border-sky-400/80 dark:hover:border-sky-500/60 ${
                  direction === "left" 
                    ? 'p-2 hover:scale-110' 
                    : compact 
                    ? 'p-2 hover:scale-110' 
                    : 'p-3 sm:p-3.5 hover:scale-125 hover:-rotate-6 hover:shadow-xl'
                }`}
                title="Compartir en Twitter/X"
              >
                {socialIcons.twitter}
                <div className="absolute inset-0 rounded-2xl bg-sky-400/30 scale-0 group-hover:scale-110 transition-all duration-500 ease-out"></div>
              </button>

              {/* Facebook */}
              <button
                onClick={() => shareToSocial('facebook')}
                className={`group relative rounded-2xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 hover:from-blue-100 hover:via-blue-200 hover:to-blue-300 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-700/20 dark:hover:from-blue-800/40 dark:hover:via-blue-700/30 dark:hover:to-blue-600/30 text-blue-600 dark:text-blue-400 transition-all duration-300 hover:shadow-lg cursor-pointer border border-blue-300/60 dark:border-blue-600/40 hover:border-blue-400/80 dark:hover:border-blue-500/60 ${
                  direction === "left" 
                    ? 'p-2.5 hover:scale-110' 
                    : compact 
                    ? 'p-2 hover:scale-110' 
                    : 'p-3 sm:p-3.5 hover:scale-125 hover:rotate-6 hover:shadow-xl'
                }`}
                title="Compartir en Facebook"
              >
                {socialIcons.facebook}
                <div className="absolute inset-0 rounded-2xl bg-blue-400/30 scale-0 group-hover:scale-110 transition-all duration-500 ease-out"></div>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => shareToSocial('whatsapp')}
                className={`group relative rounded-2xl bg-gradient-to-br from-green-50 via-green-100 to-green-200 hover:from-green-100 hover:via-green-200 hover:to-green-300 dark:from-green-900/30 dark:via-green-800/20 dark:to-green-700/20 dark:hover:from-green-800/40 dark:hover:via-green-700/30 dark:hover:to-green-600/30 text-green-600 dark:text-green-400 transition-all duration-300 hover:shadow-lg cursor-pointer border border-green-300/60 dark:border-green-600/40 hover:border-green-400/80 dark:hover:border-green-500/60 ${
                  direction === "left" 
                    ? 'p-2 hover:scale-110' 
                    : compact 
                    ? 'p-2 hover:scale-110' 
                    : 'p-3 sm:p-3.5 hover:scale-125 hover:-rotate-6 hover:shadow-xl'
                }`}
                title="Compartir en WhatsApp"
              >
                {socialIcons.whatsapp}
                <div className="absolute inset-0 rounded-2xl bg-green-400/30 scale-0 group-hover:scale-110 transition-all duration-500 ease-out"></div>
              </button>

              {/* Telegram */}
              <button
                onClick={() => shareToSocial('telegram')}
                className={`group relative rounded-2xl bg-gradient-to-br from-cyan-50 via-blue-100 to-indigo-200 hover:from-cyan-100 hover:via-blue-200 hover:to-indigo-300 dark:from-cyan-900/30 dark:via-blue-800/20 dark:to-indigo-700/20 dark:hover:from-cyan-800/40 dark:hover:via-blue-700/30 dark:hover:to-indigo-600/30 text-blue-500 dark:text-cyan-400 transition-all duration-300 hover:shadow-lg cursor-pointer border border-cyan-300/60 dark:border-cyan-600/40 hover:border-cyan-400/80 dark:hover:border-cyan-500/60 ${
                  direction === "left" 
                    ? 'p-2.5 hover:scale-110' 
                    : compact 
                    ? 'p-2 hover:scale-110' 
                    : 'p-3 sm:p-3.5 hover:scale-125 hover:rotate-6 hover:shadow-xl'
                }`}
                title="Compartir en Telegram"
              >
                {socialIcons.telegram}
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/30 scale-0 group-hover:scale-110 transition-all duration-500 ease-out"></div>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => shareToSocial('linkedin')}
                className={`group relative rounded-2xl bg-gradient-to-br from-blue-50 via-slate-100 to-slate-200 hover:from-blue-100 hover:via-slate-200 hover:to-slate-300 dark:from-slate-900/30 dark:via-slate-800/20 dark:to-slate-700/20 dark:hover:from-slate-800/40 dark:hover:via-slate-700/30 dark:hover:to-slate-600/30 text-blue-700 dark:text-slate-300 transition-all duration-300 hover:shadow-lg cursor-pointer border border-slate-300/60 dark:border-slate-600/40 hover:border-slate-400/80 dark:hover:border-slate-500/60 ${
                  direction === "left" 
                    ? 'p-2 hover:scale-110' 
                    : compact 
                    ? 'p-2 hover:scale-110' 
                    : 'p-3 sm:p-3.5 hover:scale-125 hover:-rotate-6 hover:shadow-xl'
                }`}
                title="Compartir en LinkedIn"
              >
                {socialIcons.linkedin}
                <div className="absolute inset-0 rounded-2xl bg-slate-400/30 scale-0 group-hover:scale-110 transition-all duration-500 ease-out"></div>
              </button>
              
              {/* Copy Link as Icon - For left direction */}
              {direction === "left" && (
                <button
                  onClick={handleCopyToClipboard}
                  className={`group relative rounded-2xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 hover:from-gray-100 hover:via-gray-200 hover:to-gray-300 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-700/20 dark:hover:from-gray-800/40 dark:hover:via-gray-700/30 dark:hover:to-gray-600/30 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:shadow-lg cursor-pointer border border-gray-300/60 dark:border-gray-600/40 hover:border-gray-400/80 dark:hover:border-gray-500/60 ${
                    direction === "left" 
                      ? 'p-2.5 hover:scale-110' 
                      : compact 
                      ? 'p-2 hover:scale-110' 
                      : 'p-3 sm:p-3.5 hover:scale-125 hover:rotate-6 hover:shadow-xl'
                  }`}
                  title="Copiar enlace"
                >
                  <Copy className={iconSizes[size]} />
                </button>
              )}
            </div>

            {/* Copy Link Button - Only for up/down directions */}
            {direction !== "left" && (
              <>
                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-dark-500 to-transparent mb-4"></div>

                {/* Copy Link Button - Ultra Modern */}
                <button
                  onClick={handleCopyToClipboard}
                  className={`w-full bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 hover:from-gray-100 hover:via-gray-200 hover:to-gray-100 dark:from-dark-700 dark:via-dark-600 dark:to-dark-700 dark:hover:from-dark-600 dark:hover:via-dark-500 dark:hover:to-dark-600 text-gray-700 dark:text-dark-200 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold hover:shadow-md cursor-pointer border border-gray-300/60 dark:border-dark-500/40 hover:border-gray-400/80 dark:hover:border-dark-400/60 group ${
                    compact 
                      ? 'px-4 py-2.5 text-xs hover:scale-102' 
                      : 'px-6 py-3.5 text-sm hover:scale-105 hover:shadow-xl gap-3'
                  }`}
                >
                  <Copy className={`group-hover:scale-110 transition-all duration-300 ${
                    compact ? 'h-4 w-4' : 'h-5 w-5 group-hover:rotate-12'
                  }`} />
                  <span className={compact ? '' : 'group-hover:tracking-wide transition-all duration-300'}>
                    Copiar enlace
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShareDropdown;