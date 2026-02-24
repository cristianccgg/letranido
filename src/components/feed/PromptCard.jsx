// components/feed/PromptCard.jsx - Tarjeta de prompt en el feed
import React from 'react';
import { Calendar, Zap, Archive, FileText, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const PromptCard = ({ prompt, onClick }) => {
  // Formatear rango de fechas
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('es-CO', formatOptions);
    const endStr = end.toLocaleDateString('es-CO', formatOptions);

    return `${startStr} - ${endStr}`;
  };

  // Badge de estado
  const StatusBadge = () => {
    if (prompt.status === 'active') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
          <Zap className="w-3.5 h-3.5" />
          ACTIVO
        </div>
      );
    }

    if (prompt.status === 'archived') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
          <Archive className="w-3.5 h-3.5" />
          ARCHIVO
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Semana {prompt.week_number} • {formatDateRange(prompt.start_date, prompt.end_date)}
          </span>
        </div>
        <StatusBadge />
      </div>

      {/* Contenido */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {prompt.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {prompt.description}
      </p>

      {/* Prompt text destacado */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-3 mb-4">
        <p className="text-sm font-medium text-primary-900 dark:text-primary-100 italic">
          "{prompt.prompt_text}"
        </p>
      </div>

      {/* Stats + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{prompt.stories_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span>{prompt.total_likes || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{prompt.total_comments || 0}</span>
          </div>
        </div>

        {prompt.status === 'active' ? (
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            Escribir ahora →
          </span>
        ) : (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Ver microhistorias →
          </span>
        )}
      </div>
    </div>
  );
};

export default PromptCard;
