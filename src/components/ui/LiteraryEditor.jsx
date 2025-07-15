// components/ui/LiteraryEditor.jsx - Editor para escritura literaria con Quill
import { useRef, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

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

      // Aplicar estilos personalizados
      const editor = quillRef.current.root;
      editor.style.fontFamily = '"Crimson Text", "Times New Roman", serif';
      editor.style.fontSize = "16px";
      editor.style.lineHeight = "1.6";
      editor.style.minHeight = `${rows * 1.5}em`;
      editor.style.color = "#111827";

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

  // Sincronizar valor solo cuando cambie externamente
  useEffect(() => {
    if (quillRef.current && !isUpdatingRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      // Solo actualizar si el contenido es realmente diferente
      if (value !== currentContent) {
        isUpdatingRef.current = true;
        quillRef.current.root.innerHTML = value || "";
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

  return (
    <div className={`literary-editor ${className}`}>
      <div
        ref={editorRef}
        className={`
          border border-gray-300 rounded-lg
          ${isActive ? "ring-2 ring-primary-500 border-primary-500" : ""}
          ${disabled ? "bg-gray-100" : "bg-white"}
        `}
        style={{
          minHeight: `${rows * 1.5 + 3}em`, // +3 para la toolbar
        }}
      />

      {/* Estilos CSS normales en lugar de styled-jsx */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .literary-editor .ql-toolbar {
            border-top: 1px solid #d1d5db;
            border-left: 1px solid #d1d5db;
            border-right: 1px solid #d1d5db;
            border-bottom: none;
            border-radius: 0.5rem 0.5rem 0 0;
            background: #f9fafb;
            padding: 8px;
          }
          
          .literary-editor .ql-container {
            border-bottom: 1px solid #d1d5db;
            border-left: 1px solid #d1d5db;
            border-right: 1px solid #d1d5db;
            border-top: none;
            border-radius: 0 0 0.5rem 0.5rem;
            font-size: 16px;
          }
          
          .literary-editor .ql-editor {
            padding: 16px;
            font-family: "Crimson Text", "Times New Roman", serif;
            font-size: 16px;
            line-height: 1.6;
            color: #111827;
          }
          
          .literary-editor .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: normal;
          }
          
          .literary-editor .ql-toolbar .ql-formats {
            margin-right: 15px;
          }
          
          .literary-editor .ql-toolbar button {
            width: 28px;
            height: 28px;
            border-radius: 4px;
          }
          
          .literary-editor .ql-toolbar button:hover {
            background-color: #e5e7eb;
          }
          
          .literary-editor .ql-toolbar button.ql-active {
            background-color: #d1d5db;
            color: #111827;
          }
        `,
        }}
      />
    </div>
  );
};

export default LiteraryEditor;
