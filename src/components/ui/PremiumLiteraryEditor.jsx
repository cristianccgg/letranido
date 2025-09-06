// components/ui/PremiumLiteraryEditor.jsx - Editor premium con corrector ortográfico
import { useRef, useEffect, useState } from "react";
import Quill from "quill";
import Typo from "typo-js";
import "quill/dist/quill.snow.css";
import { useTheme } from "../../contexts/ThemeContext";
import { FEATURES } from "../../lib/config";
import WritingAnalysisPanel from "./WritingAnalysisPanel";

const PremiumLiteraryEditor = ({
  value = "",
  onChange,
  placeholder = "Comienza a escribir tu historia aquí...",
  disabled = false,
  className = "",
  rows = 20,
  spellCheck = true,
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const typoRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isSpellCheckLoading, setIsSpellCheckLoading] = useState(true);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(spellCheck && FEATURES.PREMIUM_EDITOR);
  const isUpdatingRef = useRef(false);
  const { isDark } = useTheme();

  // Cargar diccionario español (solo una vez)
  useEffect(() => {
    if (!FEATURES.PREMIUM_EDITOR) {
      setIsSpellCheckLoading(false);
      return;
    }

    const loadDictionary = async () => {
      try {
        console.log("🔄 Cargando diccionario español...");
        
        // Cargar archivos de diccionario
        const [affData, dicData] = await Promise.all([
          fetch("/dictionaries/es_ES.aff").then(r => r.text()),
          fetch("/dictionaries/es_ES.dic").then(r => r.text())
        ]);

        // Inicializar Typo.js con diccionario español
        typoRef.current = new Typo("es_ES", affData, dicData);
        console.log("✅ Diccionario español cargado exitosamente");
        
        setIsSpellCheckLoading(false);
      } catch (error) {
        console.warn("⚠️ Error cargando diccionario, deshabilitando corrector:", error);
        setSpellCheckEnabled(false);
        setIsSpellCheckLoading(false);
      }
    };

    loadDictionary();
  }, []); // Solo cargar una vez al montar

  // Configuración de Quill premium
  const quillOptions = {
    theme: "snow",
    placeholder,
    readOnly: disabled,
    modules: {
      toolbar: [
        ["bold", "italic", "underline"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["clean"],
      ],
    },
    formats: ["bold", "italic", "underline", "blockquote", "code-block", "list", "indent"],
  };

  // Función para verificar ortografía de una palabra
  const checkWord = (word) => {
    if (!typoRef.current || !spellCheckEnabled) return true;
    
    // Limpiar palabra de signos de puntuación
    const cleanWord = word.replace(/[.,;:!?¡¿""''()\[\]{}]/g, '');
    if (!cleanWord || cleanWord.length < 2) return true;
    
    return typoRef.current.check(cleanWord);
  };

  // Función para obtener sugerencias
  const getSuggestions = (word) => {
    if (!typoRef.current || !spellCheckEnabled) return [];
    
    const cleanWord = word.replace(/[.,;:!?¡¿""''()\[\]{}]/g, '');
    if (!cleanWord) return [];
    
    return typoRef.current.suggest(cleanWord).slice(0, 5); // Max 5 sugerencias
  };

  // Función para marcar palabras incorrectas
  const markSpellingErrors = () => {
    if (!quillRef.current || !spellCheckEnabled || isSpellCheckLoading || !typoRef.current) return;
    
    const text = quillRef.current.getText();
    const words = text.match(/\b\w+\b/g) || [];
    
    // Limpiar formato previo
    quillRef.current.removeFormat(0, text.length);
    
    if (!spellCheckEnabled) return; // Si está deshabilitado, solo limpiar
    
    words.forEach(word => {
      if (!checkWord(word)) {
        // Encontrar la posición de la palabra en el texto
        const index = text.indexOf(word);
        if (index !== -1) {
          // Marcar como error ortográfico (fondo rojo sutil)
          quillRef.current.formatText(index, word.length, {
            'background': isDark ? '#7f1d1d' : '#fee2e2'
          });
        }
      }
    });
  };

  // Función para limpiar marcas ortográficas
  const clearSpellingMarks = () => {
    if (!quillRef.current) return;
    const text = quillRef.current.getText();
    quillRef.current.removeFormat(0, text.length);
  };

  // Inicializar Quill
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, quillOptions);

      // Configurar eventos
      quillRef.current.on("text-change", () => {
        if (onChange && !isUpdatingRef.current) {
          const html = quillRef.current.root.innerHTML;
          const text = quillRef.current.getText();
          onChange(text.trim() === "" ? "" : html);

          // Verificar ortografía después de un pequeño delay
          if (spellCheckEnabled && !isSpellCheckLoading) {
            setTimeout(markSpellingErrors, 500);
          }
        }
      });

      quillRef.current.on("selection-change", (range) => {
        setIsActive(!!range);
      });

      // Aplicar estilos personalizados
      const editor = quillRef.current.root;
      editor.style.fontFamily = '"Crimson Text", "Times New Roman", serif';
      editor.style.fontSize = "16px";
      editor.style.lineHeight = "1.6";
      editor.style.minHeight = `${rows * 1.5}em`;
      editor.style.color = isDark ? "#f3f4f6" : "#111827";
      editor.style.backgroundColor = isDark ? "#1f2937" : "#ffffff";

      // Establecer valor inicial
      if (value) {
        isUpdatingRef.current = true;
        quillRef.current.root.innerHTML = value;
        isUpdatingRef.current = false;
      }
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []); // Solo ejecutar una vez al montar

  // Sincronizar valor cuando cambie externamente
  useEffect(() => {
    if (quillRef.current && !isUpdatingRef.current && value !== undefined) {
      const currentContent = quillRef.current.root.innerHTML;
      const cleanValue = value || "";
      
      if (cleanValue !== currentContent && !(cleanValue === "" && currentContent === "<p><br></p>")) {
        isUpdatingRef.current = true;
        quillRef.current.root.innerHTML = cleanValue;
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

  // Actualizar estado de solo lectura
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  // Actualizar colores cuando cambie el tema
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.root;
      editor.style.color = isDark ? "#f3f4f6" : "#111827";
      editor.style.backgroundColor = isDark ? "#1f2937" : "#ffffff";
    }
  }, [isDark]);

  // Ejecutar verificación ortográfica cuando el diccionario esté listo
  useEffect(() => {
    if (!isSpellCheckLoading && quillRef.current) {
      if (spellCheckEnabled) {
        setTimeout(markSpellingErrors, 100);
      } else {
        clearSpellingMarks();
      }
    }
  }, [isSpellCheckLoading, spellCheckEnabled]);

  // Manejar cambio de toggle del corrector
  const handleToggleSpellCheck = () => {
    const newState = !spellCheckEnabled;
    setSpellCheckEnabled(newState);
    
    if (quillRef.current) {
      if (newState && !isSpellCheckLoading) {
        setTimeout(markSpellingErrors, 100);
      } else {
        clearSpellingMarks();
      }
    }
  };

  return (
    <div className={`premium-literary-editor ${className}`}>
      {/* Indicador de funcionalidad premium - siempre visible */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
            ✨ Editor Premium
          </span>
          {isSpellCheckLoading ? (
            <span>Cargando corrector ortográfico...</span>
          ) : spellCheckEnabled ? (
            <span>✓ Corrector ortográfico español activo</span>
          ) : (
            <span>✗ Corrector ortográfico desactivado</span>
          )}
        </div>
        
        <button
          onClick={handleToggleSpellCheck}
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          type="button"
          disabled={isSpellCheckLoading}
        >
          {spellCheckEnabled ? 'Deshabilitar' : 'Habilitar'} corrector
        </button>
      </div>

      <div
        ref={editorRef}
        className={`
          border border-gray-300 dark:border-dark-600 rounded-lg transition-colors duration-300
          ${isActive ? "ring-2 ring-primary-500 dark:ring-primary-400 border-primary-500 dark:border-primary-400" : ""}
          ${disabled ? "bg-gray-100 dark:bg-dark-800" : "bg-white dark:bg-dark-800"}
        `}
        style={{
          minHeight: `${rows * 1.5 + 3}em`, // +3 para la toolbar
        }}
      />

      {/* Contador de palabras */}
      {quillRef.current && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
          {quillRef.current.getText().split(/\s+/).filter(w => w.length > 0).length} palabras
        </div>
      )}

      {/* Panel de análisis de escritura flotante */}
      <div className="hidden md:block">
        <WritingAnalysisPanel 
          text={value} 
          className="fixed w-80 max-h-[calc(100vh-7rem)] overflow-hidden z-40"
        />
      </div>

      {/* Panel de análisis de escritura móvil */}
      <div className="block md:hidden">
        <WritingAnalysisPanel 
          text={value} 
          className="mt-4"
        />
      </div>

      {/* Estilos CSS con soporte para modo oscuro */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .premium-literary-editor .ql-toolbar {
            border-top: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-left: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-right: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-bottom: none;
            border-radius: 0.5rem 0.5rem 0 0;
            background: ${isDark ? '#374151' : '#f9fafb'};
            padding: 8px;
            transition: all 0.3s ease;
          }
          
          .premium-literary-editor .ql-container {
            border-bottom: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-left: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-right: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-top: none;
            border-radius: 0 0 0.5rem 0.5rem;
            font-size: 16px;
            overflow: hidden;
            background: ${isDark ? '#1f2937' : '#ffffff'};
            transition: all 0.3s ease;
          }
          
          .premium-literary-editor .ql-editor {
            padding: 16px;
            font-family: "Crimson Text", "Times New Roman", serif;
            font-size: 16px;
            line-height: 1.6;
            color: ${isDark ? '#f3f4f6' : '#111827'};
            background: ${isDark ? '#1f2937' : '#ffffff'};
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
            transition: all 0.3s ease;
          }
          
          .premium-literary-editor .ql-editor.ql-blank::before {
            color: ${isDark ? '#6b7280' : '#9ca3af'};
            font-style: normal;
            position: absolute;
            left: 16px;
            top: 16px;
            right: 16px;
            pointer-events: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .premium-literary-editor .ql-toolbar .ql-formats {
            margin-right: 15px;
          }
          
          .premium-literary-editor .ql-toolbar button {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            color: ${isDark ? '#d1d5db' : '#374151'};
          }
          
          .premium-literary-editor .ql-toolbar button:hover {
            background-color: ${isDark ? '#4b5563' : '#e5e7eb'};
          }
          
          .premium-literary-editor .ql-toolbar button.ql-active {
            background-color: ${isDark ? '#6366f1' : '#d1d5db'};
            color: ${isDark ? '#ffffff' : '#111827'};
          }
          
          .premium-literary-editor .ql-toolbar .ql-stroke {
            stroke: ${isDark ? '#d1d5db' : '#374151'};
          }
          
          .premium-literary-editor .ql-toolbar .ql-fill {
            fill: ${isDark ? '#d1d5db' : '#374151'};
          }
          
          .premium-literary-editor .ql-toolbar button:hover .ql-stroke {
            stroke: ${isDark ? '#f3f4f6' : '#111827'};
          }
          
          .premium-literary-editor .ql-toolbar button:hover .ql-fill {
            fill: ${isDark ? '#f3f4f6' : '#111827'};
          }
          
          .premium-literary-editor .ql-toolbar button.ql-active .ql-stroke {
            stroke: ${isDark ? '#ffffff' : '#111827'};
          }
          
          .premium-literary-editor .ql-toolbar button.ql-active .ql-fill {
            fill: ${isDark ? '#ffffff' : '#111827'};
          }

          /* Estilos para errores ortográficos */
          .premium-literary-editor .spelling-error {
            background-color: ${isDark ? '#7f1d1d' : '#fee2e2'};
            border-bottom: 2px dotted ${isDark ? '#ef4444' : '#dc2626'};
          }
        `,
        }}
      />
    </div>
  );
};

export default PremiumLiteraryEditor;