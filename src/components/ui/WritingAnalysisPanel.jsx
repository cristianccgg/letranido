// components/ui/WritingAnalysisPanel.jsx - Panel de análisis de texto para escritores
import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Eye, Target, Lightbulb, Minimize2, Maximize2 } from 'lucide-react';
import { analyzeText, getReadabilityInterpretation } from '../../utils/textAnalysis';

const WritingAnalysisPanel = ({ text, className = "", style = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('issues');
  const [position, setPosition] = useState(() => {
    // Posición inicial en la esquina superior derecha
    if (typeof window !== 'undefined') {
      return { 
        x: window.innerWidth - 340, // 320px ancho + 20px margen
        y: 96 // equivalente a top-24 (6rem)
      };
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Detectar si es panel flotante (desktop)
  const isFloating = className.includes('fixed');

  // Funciones para arrastrar (solo en panel flotante)
  const handleMouseDown = (e) => {
    if (!isFloating || isMinimized) return;
    
    const rect = e.currentTarget.closest('.bg-gray-50, .dark\\:bg-gray-900, .bg-white, .dark\\:bg-dark-800').getBoundingClientRect();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Prevenir selección de texto durante el arrastre
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isFloating) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Límites de la ventana (con margen para que no se salga completamente)
    const panelWidth = 320; // ancho del panel
    const panelHeight = 400; // altura aproximada del panel
    const margin = 50; // margen mínimo visible
    
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;
    const minX = -panelWidth + margin;
    const minY = 0;
    
    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Agregar event listeners globales para el arrastre
  useEffect(() => {
    if (isFloating && isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  // Análisis del texto en tiempo real
  const analysis = useMemo(() => {
    return analyzeText(text);
  }, [text]);

  const { issues, stats } = analysis;
  const readability = getReadabilityInterpretation(stats.readabilityScore);

  // Filtrar issues por severidad
  const errorIssues = issues.filter(issue => issue.severity === 'error');
  const warningIssues = issues.filter(issue => issue.severity === 'warning');
  const infoIssues = issues.filter(issue => issue.severity === 'info');

  const totalIssues = issues.length;

  if (!text || text.trim().length === 0) {
    return null;
  }

  return (
    <div 
      className={`${isFloating ? 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-500 shadow-xl' : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 shadow-lg'} border rounded-lg ${className} ${isDragging ? 'cursor-grabbing' : ''}`}
      style={isFloating ? {
        ...style,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        transition: isDragging ? 'none' : 'all 0.2s ease'
      } : style}
    >
      {/* Header */}
      <div 
        className={`p-3 transition-colors ${
          !isMinimized ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700' : ''
        } ${isFloating ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onClick={!isMinimized ? () => setIsExpanded(!isExpanded) : undefined}
        onMouseDown={isFloating ? handleMouseDown : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-600" />
            <span className="font-medium text-gray-900 dark:text-dark-100">
              Análisis de Escritura
            </span>
            
            {/* Botón minimizar (solo para panel flotante) */}
            {isFloating && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                  if (isMinimized) {
                    setIsExpanded(true);
                  } else {
                    setIsExpanded(false);
                  }
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded transition-colors"
                title={isMinimized ? 'Restaurar panel' : 'Minimizar panel'}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </button>
            )}
          </div>
          
          {/* Mostrar flecha solo si no está minimizado */}
          {!isMinimized && (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
        </div>
        
        {/* Segunda línea con sugerencias y legibilidad */}
        {!isMinimized && (
          <div className="flex items-center justify-between mt-2">
            <div>
              {totalIssues > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  {totalIssues} sugerencias
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-dark-400">
              <span className={`font-medium ${readability.color}`}>
                {readability.level}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && !isMinimized && (
        <div className="border-t border-gray-200 dark:border-dark-600">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-dark-600">
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'issues'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200'
              }`}
            >
              <Lightbulb className="h-4 w-4 inline mr-2" />
              Sugerencias ({totalIssues})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Estadísticas
            </button>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Tab: Sugerencias */}
            {activeTab === 'issues' && (
              <div className="space-y-3">
                {totalIssues === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-dark-400">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">¡Excelente! No se encontraron problemas importantes.</p>
                  </div>
                ) : (
                  <>
                    {/* Errores */}
                    {errorIssues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                          Problemas importantes ({errorIssues.length})
                        </h4>
                        <div className="space-y-2">
                          {errorIssues.map((issue, index) => (
                            <IssueCard key={index} issue={issue} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advertencias */}
                    {warningIssues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
                          Mejoras recomendadas ({warningIssues.length})
                        </h4>
                        <div className="space-y-2">
                          {warningIssues.map((issue, index) => (
                            <IssueCard key={index} issue={issue} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Información */}
                    {infoIssues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                          Sugerencias de estilo ({infoIssues.length})
                        </h4>
                        <div className="space-y-2">
                          {infoIssues.map((issue, index) => (
                            <IssueCard key={index} issue={issue} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab: Estadísticas */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                {/* Legibilidad */}
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-300">
                      Índice de Legibilidad
                    </span>
                    <span className={`text-sm font-bold ${readability.color}`}>
                      {stats.readabilityScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.max(5, stats.readabilityScore)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-dark-400 mt-1">
                    {readability.level}: {readability.description}
                  </p>
                </div>

                {/* Estadísticas generales */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Palabras por oración"
                    value={stats.avgWordsPerSentence}
                    ideal="15-20"
                    current={stats.avgWordsPerSentence}
                  />
                  <StatCard
                    label="Oraciones por párrafo"
                    value={stats.avgSentencesPerParagraph}
                    ideal="3-5"
                    current={stats.avgSentencesPerParagraph}
                  />
                  <StatCard
                    label="Párrafos largos"
                    value={stats.longParagraphs}
                    warning={stats.longParagraphs > 2}
                  />
                  <StatCard
                    label="Oraciones largas"
                    value={stats.longSentences}
                    warning={stats.longSentences > 3}
                  />
                  <StatCard
                    label="Palabras débiles"
                    value={stats.weakWords}
                    warning={stats.weakWords > 8}
                  />
                  <StatCard
                    label="Adverbios -mente"
                    value={stats.menteAdverbs}
                    warning={stats.menteAdverbs > 6}
                  />
                </div>

                {/* Detalles específicos */}
                {stats.weakWords > 0 && (
                  <WordDetailsSection 
                    issues={issues} 
                    type="weak_word" 
                    title="Palabras débiles encontradas"
                    icon="💡"
                  />
                )}

                {stats.menteAdverbs > 5 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
                      ⚡ Adverbios -mente detectados
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      {stats.menteAdverbs} adverbios terminados en "-mente" encontrados. 
                      Considera usar verbos más descriptivos cuando sea posible.
                    </p>
                  </div>
                )}

                {(infoIssues.filter(i => i.type === 'repeated_word_proximity').length > 0) && (
                  <WordDetailsSection 
                    issues={issues} 
                    type="repeated_word_proximity" 
                    title="Palabras repetidas por proximidad"
                    icon="🔄"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar cada issue
const IssueCard = ({ issue }) => {
  const getBorderColor = (severity) => {
    switch (severity) {
      case 'error': return 'border-red-200 dark:border-red-800';
      case 'warning': return 'border-orange-200 dark:border-orange-800';
      case 'info': return 'border-blue-200 dark:border-blue-800';
      default: return 'border-gray-200 dark:border-gray-700';
    }
  };

  const getBgColor = (severity) => {
    switch (severity) {
      case 'error': return 'bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'bg-orange-50 dark:bg-orange-900/20';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20';
      default: return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className={`border-l-3 ${getBorderColor(issue.severity)} ${getBgColor(issue.severity)} p-3 rounded-r-lg`}>
      <div className="flex items-start gap-2">
        <span className="text-sm">{issue.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-dark-100">
            {issue.message}
          </p>
          <p className="text-xs text-gray-600 dark:text-dark-400 mt-1">
            {issue.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar detalles de palabras específicas
const WordDetailsSection = ({ issues, type, title, icon }) => {
  const relatedIssues = issues.filter(issue => issue.type === type);
  
  if (relatedIssues.length === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        {icon} {title}
      </h4>
      <div className="flex flex-wrap gap-1">
        {relatedIssues.map((issue, index) => {
          // Extraer la palabra del mensaje
          const wordMatch = issue.message.match(/"([^"]+)"/);
          const word = wordMatch ? wordMatch[1] : '';
          const count = issue.message.match(/(\d+) veces?/) ? issue.message.match(/(\d+) veces?/)[1] : '';
          
          return (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300"
            >
              <strong>{word}</strong>
              {count && <span className="ml-1 text-blue-600 dark:text-blue-400">({count})</span>}
            </span>
          );
        })}
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
        {relatedIssues.length === 1 ? 'Palabra encontrada' : `${relatedIssues.length} palabras encontradas`}
      </p>
    </div>
  );
};

// Componente para estadísticas individuales
const StatCard = ({ label, value, ideal, warning = false }) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-dark-400">
          {label}
        </span>
        <span className={`text-sm font-bold ${warning ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-dark-100'}`}>
          {value}
        </span>
      </div>
      {ideal && (
        <p className="text-xs text-gray-500 dark:text-dark-500 mt-1">
          Ideal: {ideal}
        </p>
      )}
    </div>
  );
};

export default WritingAnalysisPanel;