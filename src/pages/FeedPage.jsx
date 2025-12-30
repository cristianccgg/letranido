// pages/FeedPage.jsx - Página principal del feed de microhistorias
import React, { useState } from 'react';
import { Rss, Filter, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useFeedPrompts from '../hooks/useFeedPrompts';
import PromptCard from '../components/feed/PromptCard';

const FeedPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const { prompts, loading, error, activePrompt } = useFeedPrompts(filter);

  // Separar prompts activos de archivados para mostrar en orden
  const activePrompts = prompts.filter(p => p.status === 'active');
  const archivedPrompts = prompts.filter(p => p.status === 'archived');

  const handlePromptClick = (promptId) => {
    navigate(`/feed/prompt/${promptId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Rss className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Feed de Escritura</h1>
          </div>
          <p className="text-lg text-white/90">
            Prompts semanales para practicar escritura ágil (50-300 palabras)
          </p>

          {/* Prompt activo destacado */}
          {activePrompt && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">Prompt activo esta semana</span>
              </div>
              <p className="text-white/90 text-sm">
                "{activePrompt.prompt_text}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'archived'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Archivo
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando prompts...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="font-medium">Error al cargar prompts</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Lista de prompts */}
        {!loading && !error && (
          <>
            {/* Prompts activos */}
            {activePrompts.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  ✨ Prompts Activos
                </h2>
                {activePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={() => handlePromptClick(prompt.id)}
                  />
                ))}
              </div>
            )}

            {/* Prompts archivados */}
            {archivedPrompts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  📁 Archivo
                </h2>
                {archivedPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={() => handlePromptClick(prompt.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {prompts.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Rss className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  No hay prompts disponibles
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Vuelve pronto para ver nuevos prompts de escritura
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
