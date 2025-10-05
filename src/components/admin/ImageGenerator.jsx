// components/admin/ImageGenerator.jsx - Generador de imágenes para posts de redes sociales
import { useRef, useEffect, useState, useCallback } from "react";
import logoImage from "../../assets/images/letranido-logo.png";

const ImageGenerator = ({
  post,
  platform = "instagram",
  contest,
  onImageGenerated,
}) => {
  const canvasRef = useRef(null);
  const logoRef = useRef(null);

  // Estados para edición de contenido
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState({
    title: "",
    subtitle: "",
    description: "",
    details: "",
  });

  // Configuraciones por plataforma - Formato cuadrado unificado
  const platformConfig = {
    instagram: { width: 1080, height: 1080 },
    facebook: { width: 1080, height: 1080 },
    twitter: { width: 1080, height: 1080 },
    linkedin: { width: 1080, height: 1080 },
  };

  // Mapeo de emojis por tipo de post
  const postEmojis = {
    new_contest: "🎯",
    tips: "✍️",
    motivation: "🔥",
    reminder: "⏰",
    last_call: "🚨",
    voting_start: "🗳️",
    read_stories: "📚",
    results: "🏆",
  };

  // Extraer contenido inicial del post para edición
  const extractInitialContent = useCallback(() => {
    if (!post) return;

    const postLines = post.content.split("\n").filter((line) => line.trim());

    let postTitle = "";
    let contestTitle = "";
    let description = "";
    let details = [];

    // Extraer contenido usando la misma lógica que generateImage
    for (let i = 0; i < postLines.length; i++) {
      const line = postLines[i].trim();

      if (line.includes("🎯") && line.includes("RETO") && !postTitle) {
        postTitle = line.replace(/🎯/g, "").trim();
      }

      if (line.startsWith('"') && line.endsWith('"') && !contestTitle) {
        contestTitle = line;
      }

      if (
        !line.includes("📝") &&
        !line.includes("📅") &&
        !line.includes("✍️") &&
        !line.includes("🎯") &&
        !line.includes("🏆") &&
        !line.includes("🔗") &&
        line.length > 20 &&
        !line.startsWith('"') &&
        !description
      ) {
        description = line;
        if (i + 1 < postLines.length) {
          const nextLine = postLines[i + 1].trim();
          if (
            !nextLine.includes("📝") &&
            !nextLine.includes("📅") &&
            nextLine.length > 10
          ) {
            description += " " + nextLine;
          }
        }
      }

      if (
        (line.includes("📝") || line.includes("📅")) &&
        !line.includes("letranido.com")
      ) {
        // Limpiar emojis al extraer detalles
        const cleanLine = line.replace(/[📚🗳️⏰🎯✍️🔥🚨🏆📝📅🔗]/g, "").trim();
        if (cleanLine) details.push(cleanLine);
      }
    }

    // Usar el título principal del post como base para el título personalizable
    const mainTitle = post.title.replace(/🎯|✍️|🔥|⏰|🚨|🗳️|📚|🏆/g, "").trim();

    setEditableContent({
      title: mainTitle || "Título personalizable", // Usar el título principal como base
      subtitle:
        contestTitle ||
        (contest ? `"${contest.title}"` : '"Reto personalizable"'),
      description: description || "Descripción personalizable del reto...",
      details:
        details.join(" • ") ||
        (contest
          ? `📝 ${contest.min_words} - ${contest.max_words} palabras`
          : "📝 Detalles personalizables"),
    });
  }, [post, contest]);

  // Inicializar contenido editable SOLO cuando cambie el post o contest (no cuando se edite)
  useEffect(() => {
    if (post) {
      extractInitialContent();
    }
  }, [post, contest, extractInitialContent]);

  // Cargar logo como imagen
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      logoRef.current = img;
      // Regenerar imagen cuando el logo esté listo
      if (post) {
        setTimeout(generateImage, 100);
      }
    };
    img.src = logoImage;
  }, [post]);

  // Función para dibujar formas orgánicas solo en esquinas diagonales
  const drawOrganicBackground = (ctx, canvas) => {
    ctx.save();

    // Color morado del diseño
    const purpleColor = "#8B5CF6";
    ctx.fillStyle = purpleColor;

    // Esquina superior izquierda - triángulo con lado interno ondulado
    ctx.beginPath();
    ctx.moveTo(0, 0); // Esquina exacta
    ctx.lineTo(canvas.width * 0.3, 0); // Línea recta horizontal
    // Lado interno ondulado
    ctx.bezierCurveTo(
      canvas.width * 0.25,
      canvas.height * 0.05,
      canvas.width * 0.15,
      canvas.height * 0.08,
      canvas.width * 0.08,
      canvas.height * 0.15
    );
    ctx.bezierCurveTo(
      canvas.width * 0.05,
      canvas.height * 0.2,
      canvas.width * 0.02,
      canvas.height * 0.25,
      0,
      canvas.height * 0.3
    );
    ctx.closePath();
    ctx.fill();

    // Esquina inferior derecha - triángulo con lado interno ondulado
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height); // Esquina exacta
    ctx.lineTo(canvas.width, canvas.height * 0.7); // Línea recta vertical
    // Lado interno ondulado
    ctx.bezierCurveTo(
      canvas.width * 0.95,
      canvas.height * 0.75,
      canvas.width * 0.92,
      canvas.height * 0.85,
      canvas.width * 0.85,
      canvas.height * 0.92
    );
    ctx.bezierCurveTo(
      canvas.width * 0.8,
      canvas.height * 0.95,
      canvas.width * 0.75,
      canvas.height * 0.98,
      canvas.width * 0.7,
      canvas.height
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Función para dibujar elementos decorativos (estrellas y corazones)
  const drawDecorativos = (ctx, canvas, scale) => {
    ctx.save();

    const purpleColor = "#8B5CF6";
    const lightPurple = "#A78BFA";

    // Estrellas decorativas
    const stars = [
      { x: 0.15, y: 0.3, size: 30, color: purpleColor, opacity: 0.8 },
      { x: 0.85, y: 0.2, size: 25, color: lightPurple, opacity: 0.7 },
      { x: 0.12, y: 0.7, size: 20, color: purpleColor, opacity: 0.6 },
      { x: 0.88, y: 0.75, size: 28, color: lightPurple, opacity: 0.9 },
    ];

    stars.forEach((star) => {
      ctx.save();
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.opacity;
      ctx.font = `${Math.round(star.size * scale)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("⭐", canvas.width * star.x, canvas.height * star.y);
      ctx.restore();
    });

    // Corazones decorativos
    const hearts = [
      { x: 0.25, y: 0.25, size: 25, color: lightPurple, opacity: 0.7 },
      { x: 0.78, y: 0.4, size: 22, color: purpleColor, opacity: 0.6 },
      { x: 0.2, y: 0.8, size: 20, color: lightPurple, opacity: 0.8 },
      { x: 0.85, y: 0.85, size: 26, color: purpleColor, opacity: 0.7 },
    ];

    hearts.forEach((heart) => {
      ctx.save();
      ctx.fillStyle = heart.color;
      ctx.globalAlpha = heart.opacity;
      ctx.font = `${Math.round(heart.size * scale)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("💜", canvas.width * heart.x, canvas.height * heart.y);
      ctx.restore();
    });

    ctx.restore();
  };

  // Función para dibujar texto con sombra suave
  const drawTextWithShadow = (
    ctx,
    text,
    x,
    y,
    shadowOffset = 2,
    shadowOpacity = 0.2
  ) => {
    // Sombra
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.fillText(text, x + shadowOffset, y + shadowOffset);
    ctx.restore();

    // Texto principal
    ctx.fillText(text, x, y);
  };

  // Generar imagen
  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !post) return;

    const ctx = canvas.getContext("2d");
    const config = platformConfig[platform];

    // Configurar canvas
    canvas.width = config.width;
    canvas.height = config.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo blanco base
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuraciones de texto - Todas las imágenes son cuadradas ahora
    const baseSize = 1080;
    const scale = canvas.width / baseSize;

    // Formas orgánicas de fondo (como en tu diseño de Procreate)
    drawOrganicBackground(ctx, canvas);

    // Elementos decorativos (estrellas y corazones)
    drawDecorativos(ctx, canvas, scale);

    // Layout más simple, sin header superior
    const marginX = Math.round(60 * scale);
    const maxWidth = canvas.width - marginX * 5; // Máximo margen para textos muy cómodos

    // Función para dividir texto en líneas (necesitamos declararla antes de usarla)
    const wrapText = (
      text,
      maxWidth,
      fontSize,
      fontFamily = "system-ui, -apple-system, sans-serif"
    ) => {
      ctx.font = `${Math.round(fontSize * scale)}px ${fontFamily}`;
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Función helper para procesar texto con saltos de línea y bullets
    const processTextWithLineBreaks = (text, maxWidth, fontSize, fontFamily) => {
      if (!text) return [];
      
      // Limpiar emojis
      const cleanText = text
        .replace(/📚|🗳️|⏰|🎯|✍️|🔥|🚨|🏆|📝|📅|🔗/gu, "")
        .trim();
      
      // Dividir por saltos de línea primero, luego envolver cada línea si es necesario
      const paragraphs = cleanText.split('\n').filter(p => p.trim());
      const allLines = [];
      
      paragraphs.forEach((paragraph, pIndex) => {
        const wrappedLines = wrapText(paragraph.trim(), maxWidth, fontSize, fontFamily);
        allLines.push(...wrappedLines);
        
        // Agregar espacio extra entre párrafos (excepto el último)
        if (pIndex < paragraphs.length - 1) {
          allLines.push(''); // Línea vacía para espacio
        }
      });
      
      return allLines;
    };

    // Título principal - Fuente más creativa y divertida
    ctx.fillStyle = "#4C1D95"; // Morado más oscuro para contraste
    ctx.font = `bold ${Math.round(52 * scale)}px "Comic Sans MS", "Marker Felt", "Trebuchet MS", cursive, sans-serif`;
    ctx.textAlign = "center";

    const titleY = Math.round(250 * scale); // Más arriba, sin header

    // Usar el título personalizable o el título original como fallback
    const displayTitle =
      isEditing && editableContent.title
        ? editableContent.title
        : editableContent.title ||
          post.title.replace(/🎯|✍️|🔥|⏰|🚨|🗳️|📚|🏆/g, "").trim();

    // Dividir título principal en múltiples líneas si es necesario (con soporte para saltos de línea)
    const titleLines = processTextWithLineBreaks(
      displayTitle,
      maxWidth,
      52,
      '"Comic Sans MS", "Marker Felt", "Trebuchet MS", cursive, sans-serif'
    );

    // Dibujar el título principal
    titleLines.slice(0, 2).forEach((line, lineIndex) => {
      // Solo dibujar si la línea no está vacía (las líneas vacías son para espaciado)
      if (line.trim()) {
        drawTextWithShadow(
          ctx,
          line,
          canvas.width / 2,
          titleY + lineIndex * Math.round(60 * scale),
          Math.round(2 * scale),
          0.12
        );
      }
    });

    // Usar contenido editable si está en modo edición, sino extraer del post
    let postTitle, contestTitle, description, details;

    if (isEditing && editableContent.title) {
      // Usar contenido editado
      postTitle = editableContent.title;
      contestTitle = editableContent.subtitle;
      description = editableContent.description;
      details = editableContent.details ? [editableContent.details] : [];
    } else {
      // Extraer contenido del post original
      const postLines = post.content.split("\n").filter((line) => line.trim());

      postTitle = "";
      contestTitle = "";
      description = "";
      details = [];

      for (let i = 0; i < postLines.length; i++) {
        const line = postLines[i].trim();

        if (line.includes("🎯") && line.includes("RETO") && !postTitle) {
          postTitle = line.replace(/🎯/g, "").trim();
        }

        if (line.startsWith('"') && line.endsWith('"') && !contestTitle) {
          contestTitle = line;
        }

        if (
          !line.includes("📝") &&
          !line.includes("📅") &&
          !line.includes("✍️") &&
          !line.includes("🎯") &&
          !line.includes("🏆") &&
          !line.includes("🔗") &&
          line.length > 20 &&
          !line.startsWith('"') &&
          !description
        ) {
          description = line;
          if (i + 1 < postLines.length) {
            const nextLine = postLines[i + 1].trim();
            if (
              !nextLine.includes("📝") &&
              !nextLine.includes("📅") &&
              nextLine.length > 10
            ) {
              description += " " + nextLine;
            }
          }
        }

        if (
          (line.includes("📝") || line.includes("📅")) &&
          !line.includes("letranido.com")
        ) {
          details.push(line);
        }
      }
    }

    // Calcular CTA Y position ANTES de usarlo
    const ctaYPos = canvas.height - Math.round(250 * scale);

    // Calcular altura del título para el layout
    const titleHeight = titleLines.length * Math.round(60 * scale);

    // Calcular altura disponible para contenido (se usa implícitamente en los cálculos de spacing)
    // const availableHeight = ctaYPos - titleY - Math.round(100 * scale);

    // Calcular contenido disponible y distribuir uniformemente, considerando el título principal
    const availableContentHeight =
      ctaYPos -
      (titleY + titleHeight + Math.round(40 * scale)) -
      Math.round(40 * scale); // Espacio disponible entre título principal y CTA

    // Preparar contenido y calcular alturas necesarias
    const contentItems = [];

    // 1. Título secundario del post (extraído del contenido) - Opcional
    if (postTitle && postTitle !== displayTitle) {
      const titleLines = wrapText(postTitle, maxWidth, 36);
      contentItems.push({
        type: "secondary-title",
        lines: titleLines.slice(0, 2),
        height: titleLines.slice(0, 2).length * Math.round(42 * scale),
      });
    }

    // 2. Título del reto (ej: "El último día de...")
    if (contestTitle) {
      const contestLines = processTextWithLineBreaks(contestTitle, maxWidth, 36, '"Georgia", "Times New Roman", serif');
      contentItems.push({
        type: "contest-title",
        lines: contestLines.slice(0, 3), // Permitir hasta 3 líneas
        height: contestLines.slice(0, 3).length * Math.round(42 * scale),
      });
    }

    // 3. Descripción del reto - Con soporte para saltos de línea y bullets
    if (description) {
      const allDescLines = processTextWithLineBreaks(description, maxWidth, 30, '"Trebuchet MS", "Verdana", sans-serif');
      
      const lineHeight = Math.round(36 * scale);
      contentItems.push({
        type: "description",
        lines: allDescLines,
        height: allDescLines.length * lineHeight,
        groupWithPrevious: true, // Agrupación visual con título del reto
      });
    }

    // 4. Detalles técnicos (palabras, fecha) - Con soporte para saltos de línea
    if (details.length > 0) {
      // Unir todos los detalles en un solo texto con saltos de línea
      const allDetailsText = details.join('\n');
      const allDetailLines = processTextWithLineBreaks(allDetailsText, maxWidth, 28, '"Trebuchet MS", "Verdana", sans-serif');
      
      contentItems.push({
        type: "details",
        lines: allDetailLines,
        height: allDetailLines.length * Math.round(32 * scale),
      });
    }

    // Calcular altura total del contenido
    const totalContentHeight = contentItems.reduce(
      (sum, item) => sum + item.height,
      0
    );

    // Distribuir espacio considerando agrupaciones visuales
    const remainingSpace = availableContentHeight - totalContentHeight;
    const normalSpacing =
      contentItems.length > 1
        ? remainingSpace / (contentItems.length + 1)
        : remainingSpace / 2;
    const groupSpacing = Math.round(15 * scale); // Espacio reducido entre elementos agrupados

    // Posición inicial considerando el espacio del título principal (puede ser múltiples líneas)
    let currentY =
      titleY + titleHeight + Math.round(40 * scale) + normalSpacing;

    // Renderizar cada elemento con espaciado adaptativo
    contentItems.forEach((item) => {
      if (item.type === "secondary-title") {
        ctx.fillStyle = "#4C1D95"; // Morado oscuro para contraste
        ctx.font = `bold ${Math.round(36 * scale)}px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif`;
        item.lines.forEach((line, lineIndex) => {
          drawTextWithShadow(
            ctx,
            line,
            canvas.width / 2,
            currentY + lineIndex * Math.round(42 * scale),
            Math.round(2 * scale),
            0.2
          );
        });
      } else if (item.type === "contest-title") {
        ctx.fillStyle = "#4C1D95"; // Morado oscuro para contraste
        ctx.font = `bold ${Math.round(36 * scale)}px "Georgia", "Times New Roman", serif`;
        item.lines.forEach((line, lineIndex) => {
          // Solo dibujar si la línea no está vacía (las líneas vacías son para espaciado)
          if (line.trim()) {
            drawTextWithShadow(
              ctx,
              line,
              canvas.width / 2,
              currentY + lineIndex * Math.round(42 * scale),
              Math.round(2 * scale),
              0.2
            );
          }
        });
      } else if (item.type === "description") {
        ctx.fillStyle = "#4C1D95"; // Morado oscuro para buena legibilidad
        ctx.font = `${Math.round(30 * scale)}px "Trebuchet MS", "Verdana", sans-serif`;
        const lineHeight = Math.round(36 * scale);
        item.lines.forEach((line, lineIndex) => {
          // Solo dibujar si la línea no está vacía (las líneas vacías son para espaciado)
          if (line.trim()) {
            // Convertir bullets a símbolos uniformes
            const processedLine = line.trim().startsWith('-') ? line.replace('-', '•') : 
                                line.trim().startsWith('*') ? line.replace('*', '•') : line;
            
            drawTextWithShadow(
              ctx,
              processedLine,
              canvas.width / 2,
              currentY + lineIndex * lineHeight,
              Math.round(1 * scale),
              0.15
            );
          }
        });
      } else if (item.type === "details") {
        ctx.fillStyle = "#4C1D95"; // Morado oscuro para detalles
        ctx.font = `${Math.round(28 * scale)}px "Trebuchet MS", "Verdana", sans-serif`;
        item.lines.forEach((line, lineIndex) => {
          // Solo dibujar si la línea no está vacía (las líneas vacías son para espaciado)
          if (line.trim()) {
            // Convertir bullets a símbolos uniformes
            const processedLine = line.trim().startsWith('-') ? line.replace('-', '•') : 
                                line.trim().startsWith('*') ? line.replace('*', '•') : line;
            
            drawTextWithShadow(
              ctx,
              processedLine,
              canvas.width / 2,
              currentY + lineIndex * Math.round(32 * scale),
              Math.round(1 * scale),
              0.15
            );
          }
        });
      }

      // Aplicar espaciado adaptativo según si es agrupado o no
      const nextSpacing = item.groupWithPrevious ? groupSpacing : normalSpacing;
      currentY += item.height + nextSpacing;
    });

    // Call to action
    const ctaY = ctaYPos;

    // Texto del CTA - Estilo como en tu diseño
    ctx.fillStyle = "#4C1D95"; // Morado oscuro para contraste
    ctx.font = `bold ${Math.round(42 * scale)}px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif`;
    ctx.textAlign = "center";
    drawTextWithShadow(
      ctx,
      "letranido.com",
      canvas.width / 2,
      ctaY,
      Math.round(3 * scale),
      0.3
    );

    // Notificar que la imagen está lista
    if (onImageGenerated) {
      onImageGenerated(canvas.toDataURL("image/png"));
    }
  };

  // Generar imagen cuando cambie el post, plataforma o contest
  useEffect(() => {
    if (post) {
      // Pequeño delay para asegurar que el canvas esté listo
      setTimeout(generateImage, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, platform, contest]);

  // Función para descargar la imagen
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${post.type}-${platform}-letranido.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="image-generator">
      {/* Editor de contenido */}
      {post && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h6 className="text-sm font-medium text-gray-700">
              Contenido de la imagen:
            </h6>
            <button
              onClick={() => {
                if (isEditing) {
                  // Al guardar, regenerar imagen
                  setTimeout(generateImage, 100);
                }
                setIsEditing(!isEditing);
              }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isEditing
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              {isEditing ? "💾 Guardar" : "✏️ Editar"}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Título principal (será el título grande de la imagen):
                </label>
                <input
                  type="text"
                  value={editableContent.title}
                  onChange={(e) =>
                    setEditableContent((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="ej: ¡NUEVO RETO DE ESCRITURA!"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Título del reto:
                </label>
                <input
                  type="text"
                  value={editableContent.subtitle}
                  onChange={(e) =>
                    setEditableContent((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  placeholder='ej: "El último día de..."'
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descripción:
                </label>
                <textarea
                  value={editableContent.description}
                  onChange={(e) =>
                    setEditableContent((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  rows="2"
                  placeholder="Descripción del reto..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Detalles:
                </label>
                <input
                  type="text"
                  value={editableContent.details}
                  onChange={(e) =>
                    setEditableContent((prev) => ({
                      ...prev,
                      details: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="📝 100-500 palabras • 📅 Hasta: 26/9/2025"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              <div className="font-medium">{editableContent.title}</div>
              <div className="text-gray-600">{editableContent.subtitle}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {editableContent.description}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {editableContent.details}
              </div>
            </div>
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          height: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
        }}
      />

      {post && (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Dimensiones: {platformConfig[platform].width} x{" "}
            {platformConfig[platform].height}
          </div>
          <button
            onClick={downloadImage}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            📥 Descargar Imagen
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
