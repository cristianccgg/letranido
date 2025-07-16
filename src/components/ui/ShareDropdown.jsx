import React, { useState, useRef, useEffect } from "react";
import { Users, Copy, CheckCircle } from "lucide-react";

const ShareDropdown = ({ shareData, className = "", size = "default" }) => {
  const [copied, setCopied] = useState(false);

  const { url } = shareData;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buttonSizes = {
    small: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-sm",
    large: "px-5 py-3 text-base",
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-4 w-4",
    large: "h-5 w-5",
  };

  return (
    <button
      onClick={handleCopyToClipboard}
      className={`${buttonSizes[size]} ${
        copied
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-blue-100 hover:bg-blue-200 text-gray-700 hover:scale-105 transition-all duration-300 ease-in-out"
      } rounded-lg transition-colors flex items-center gap-2  cursor-pointer ${className}`}
      title={copied ? "¡Enlace copiado!" : "Invitar amigos al concurso"}
    >
      {copied ? (
        <>
          <CheckCircle className={iconSizes[size]} />
          <span>¡Enlace copiado!</span>
        </>
      ) : (
        <>
          <Users className={iconSizes[size]} />
          <span>Invitar amigos</span>
        </>
      )}
    </button>
  );
};

export default ShareDropdown;
