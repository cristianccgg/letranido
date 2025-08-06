import { Facebook } from "lucide-react";

export default function FacebookButton() {
  return (
    <a
      href="https://web.facebook.com/profile.php?id=61579066655489"
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-50 md:w-8 md:h-8 w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:from-pink-600 hover:to-purple-700 group"
      title="Síguenos en Facebook"
    >
      <Facebook className="w-4 h-4 md:w-5 md:h-5" />

      {/* Pequeño punto de notificación */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse opacity-80 group-hover:opacity-100"></div>
    </a>
  );
}
