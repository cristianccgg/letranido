// components/ui/LiteraryEditor.jsx - Editor para escritura literaria con Quill
import { useRef, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useTheme } from "../../contexts/ThemeContext";

const LiteraryEditor = ({
  value = "",
  onChange,
  placeholder = "Comienza a escribir tu historia aquí...",
  disabled = false,
  className = "",
  rows = 20,
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const isUpdatingRef = useRef(false);
  const { isDark } = useTheme();

  // Configuración de Quill simple para escritura creativa
  const quillOptions = {
    theme: "snow",
    placeholder,
    readOnly: disabled,
    modules: {
      toolbar: [
        ["bold", "italic"],
        ["blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    },
    formats: ["bold", "italic", "blockquote", "list"],
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
        }
      });

      quillRef.current.on("selection-change", (range) => {
        setIsActive(!!range);
      });

      // Prevenir auto-corrección de doble espacio a punto
      quillRef.current.keyboard.addBinding({
        key: ' ',
        handler: function(range, context) {
          // Si hay dos espacios seguidos al final, prevenir la auto-corrección
          const text = this.quill.getText();
          const cursorPos = range.index;
          
          if (cursorPos > 0 && text[cursorPos - 1] === ' ') {
            // Insertar espacio normal sin auto-corrección
            this.quill.insertText(cursorPos, ' ', 'user');
            this.quill.setSelection(cursorPos + 1);
            return false; // Prevenir el comportamiento por defecto
          }
          
          return true; // Permitir comportamiento normal para espacios únicos
        }
      });

      // Aplicar estilos personalizados y desactivar auto-corrección
      const editor = quillRef.current.root;
      editor.style.fontFamily = '"Crimson Text", "Times New Roman", serif';
      editor.style.fontSize = "16px";
      editor.style.lineHeight = "1.6";
      editor.style.minHeight = `${rows * 1.5}em`;
      editor.style.color = isDark ? "#f3f4f6" : "#111827";
      editor.style.backgroundColor = isDark ? "#1f2937" : "#ffffff";
      
      // Desactivar auto-corrección y auto-capitalización para escritura literaria
      editor.setAttribute('autocorrect', 'off');
      editor.setAttribute('autocapitalize', 'off');
      editor.setAttribute('spellcheck', 'false');
      
      // Mejoras UX: atajos de teclado
      quillRef.current.keyboard.addBinding({
        key: 's',
        ctrlKey: true
      }, function(range, context) {
        // Ctrl+S no hace nada visible (ya se guarda automáticamente)
        // Pero previene el diálogo del navegador
        return false;
      });

      quillRef.current.keyboard.addBinding({
        key: 's',
        metaKey: true
      }, function(range, context) {
        // Cmd+S en Mac
        return false;
      });

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

  // Sincronizar valor solo cuando cambie externamente - OPTIMIZADO
  useEffect(() => {
    if (quillRef.current && !isUpdatingRef.current && value !== undefined) {
      const currentContent = quillRef.current.root.innerHTML;
      const cleanValue = value || "";
      
      // Solo actualizar si el contenido es realmente diferente y no está vacío de forma natural
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

  return (
    <div className={`literary-editor ${className}`}>
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

      {/* Estilos CSS con soporte para modo oscuro */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .literary-editor .ql-toolbar {
            border-top: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-left: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-right: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
            border-bottom: none;
            border-radius: 0.5rem 0.5rem 0 0;
            background: ${isDark ? '#374151' : '#f9fafb'};
            padding: 8px;
            transition: all 0.3s ease;
          }
          
          .literary-editor .ql-container {
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
          
          .literary-editor .ql-editor {
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
          
          .literary-editor .ql-editor.ql-blank::before {
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
          
          .literary-editor .ql-toolbar .ql-formats {
            margin-right: 15px;
          }
          
          .literary-editor .ql-toolbar button {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            color: ${isDark ? '#d1d5db' : '#374151'};
          }
          
          .literary-editor .ql-toolbar button:hover {
            background-color: ${isDark ? '#4b5563' : '#e5e7eb'};
          }
          
          .literary-editor .ql-toolbar button.ql-active {
            background-color: ${isDark ? '#6366f1' : '#d1d5db'};
            color: ${isDark ? '#ffffff' : '#111827'};
          }
          
          .literary-editor .ql-toolbar .ql-stroke {
            stroke: ${isDark ? '#d1d5db' : '#374151'};
          }
          
          .literary-editor .ql-toolbar .ql-fill {
            fill: ${isDark ? '#d1d5db' : '#374151'};
          }
          
          .literary-editor .ql-toolbar button:hover .ql-stroke {
            stroke: ${isDark ? '#f3f4f6' : '#111827'};
          }
          
          .literary-editor .ql-toolbar button:hover .ql-fill {
            fill: ${isDark ? '#f3f4f6' : '#111827'};
          }
          
          .literary-editor .ql-toolbar button.ql-active .ql-stroke {
            stroke: ${isDark ? '#ffffff' : '#111827'};
          }
          
          .literary-editor .ql-toolbar button.ql-active .ql-fill {
            fill: ${isDark ? '#ffffff' : '#111827'};
          }
        `,
        }}
      />
    </div>
  );
};

export default LiteraryEditor;
