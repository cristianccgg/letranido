// components/admin/ImageGenerator.jsx - Generador de imágenes para posts de redes sociales
import { useRef, useEffect, useState, useCallback } from "react";

const ImageGenerator = ({
  post,
  platform = "instagram",
  contest,
  onImageGenerated,
}) => {
  const canvasRef = useRef(null);

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

  // Inicializar contenido editable cuando cambie el post o contest
  useEffect(() => {
    if (post && !isEditing) {
      extractInitialContent();
    }
  }, [post, contest, isEditing, extractInitialContent]);

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

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#6366f1"); // Purple
    gradient.addColorStop(0.5, "#8b5cf6"); // Purple-pink
    gradient.addColorStop(1, "#ec4899"); // Pink

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuraciones de texto - Todas las imágenes son cuadradas ahora
    const baseSize = 1080;
    const scale = canvas.width / baseSize;

    // Header - Logo y marca
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.round(48 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";

    const headerY = Math.round(80 * scale);
    const marginX = Math.round(60 * scale);

    // Logo emoji
    ctx.font = `${Math.round(40 * scale)}px system-ui`;
    ctx.fillText("🪶", marginX, headerY);

    // Texto "LETRANIDO"
    ctx.font = `bold ${Math.round(48 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText("LETRANIDO", marginX + Math.round(60 * scale), headerY);

    // Línea separadora
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.round(2 * scale);
    ctx.beginPath();
    ctx.moveTo(marginX, headerY + Math.round(30 * scale));
    ctx.lineTo(canvas.width - marginX, headerY + Math.round(30 * scale));
    ctx.stroke();

    // Emoji del tipo de post - Formato cuadrado unificado
    const postEmoji = postEmojis[post.type] || "✨";
    ctx.font = `${Math.round(90 * scale)}px system-ui`;
    ctx.textAlign = "center";

    const emojiY = Math.round(200 * scale);
    ctx.fillText(postEmoji, canvas.width / 2, emojiY);

    // Título del post - Ahora usa el contenido personalizable
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.round(48 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";

    const titleY = emojiY + Math.round(90 * scale);

    // Usar el título personalizable o el título original como fallback
    const displayTitle =
      isEditing && editableContent.title
        ? editableContent.title
        : editableContent.title ||
          post.title.replace(/🎯|✍️|🔥|⏰|🚨|🗳️|📚|🏆/g, "").trim();

    ctx.fillText(displayTitle, canvas.width / 2, titleY);

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

    // Función para dividir texto en líneas
    const wrapText = (text, maxWidth, fontSize) => {
      ctx.font = `${Math.round(fontSize * scale)}px system-ui, -apple-system, sans-serif`;
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

    const maxWidth = canvas.width - marginX * 2;

    // Calcular CTA Y position ANTES de usarlo
    const ctaYPos = canvas.height - Math.round(120 * scale);

    // Calcular altura disponible para contenido (se usa implícitamente en los cálculos de spacing)
    // const availableHeight = ctaYPos - titleY - Math.round(100 * scale);

    // Calcular contenido disponible y distribuir uniformemente
    const availableContentHeight = ctaYPos - titleY - Math.round(80 * scale); // Espacio disponible entre título principal y CTA

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
      const contestLines = wrapText(contestTitle, maxWidth, 32);
      contentItems.push({
        type: "contest-title",
        lines: contestLines.slice(0, 1),
        height: contestLines.slice(0, 1).length * Math.round(38 * scale),
      });
    }

    // 3. Descripción del reto - Sin emojis
    if (description) {
      // Limpiar emojis de la descripción
      const cleanDescription = description
        .replace(/[📚🗳️⏰🎯✍️🔥🚨🏆📝📅🔗]/g, "")
        .trim();
      const descLines = wrapText(cleanDescription, maxWidth, 24);
      const lineHeight = Math.round(30 * scale);
      contentItems.push({
        type: "description",
        lines: descLines,
        height: descLines.length * lineHeight,
      });
    }

    // 4. Detalles técnicos (palabras, fecha) - Sin emojis
    if (details.length > 0) {
      const cleanDetails = details.map((detail) =>
        detail.replace(/[📚🗳️⏰🎯✍️🔥🚨🏆📝📅🔗]/g, "").trim()
      );
      contentItems.push({
        type: "details",
        lines: cleanDetails.slice(0, 2),
        height: cleanDetails.slice(0, 2).length * Math.round(28 * scale),
      });
    }

    // Calcular altura total del contenido
    const totalContentHeight = contentItems.reduce(
      (sum, item) => sum + item.height,
      0
    );

    // Distribuir espacio uniformemente (justify-content: space-evenly)
    const remainingSpace = availableContentHeight - totalContentHeight;
    const spacing =
      contentItems.length > 1
        ? remainingSpace / (contentItems.length + 1)
        : remainingSpace / 2;

    // Posición inicial con espaciado uniforme
    let currentY = titleY + Math.round(60 * scale) + spacing;

    // Renderizar cada elemento con espaciado uniforme
    contentItems.forEach((item, index) => {
      if (item.type === "secondary-title") {
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.round(36 * scale)}px system-ui, -apple-system, sans-serif`;
        item.lines.forEach((line, lineIndex) => {
          ctx.fillText(
            line,
            canvas.width / 2,
            currentY + lineIndex * Math.round(42 * scale)
          );
        });
      } else if (item.type === "contest-title") {
        ctx.fillStyle = "#f1f5f9";
        ctx.font = `bold ${Math.round(32 * scale)}px system-ui, -apple-system, sans-serif`;
        item.lines.forEach((line, lineIndex) => {
          ctx.fillText(
            line,
            canvas.width / 2,
            currentY + lineIndex * Math.round(38 * scale)
          );
        });
      } else if (item.type === "description") {
        ctx.fillStyle = "#e2e8f0";
        ctx.font = `${Math.round(24 * scale)}px system-ui, -apple-system, sans-serif`;
        const lineHeight = Math.round(30 * scale);
        item.lines.forEach((line, lineIndex) => {
          ctx.fillText(
            line,
            canvas.width / 2,
            currentY + lineIndex * lineHeight
          );
        });
      } else if (item.type === "details") {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = `${Math.round(22 * scale)}px system-ui, -apple-system, sans-serif`;
        item.lines.forEach((line, lineIndex) => {
          ctx.fillText(
            line,
            canvas.width / 2,
            currentY + lineIndex * Math.round(28 * scale)
          );
        });
      }

      currentY += item.height + spacing;
    });

    // Call to action
    const ctaY = ctaYPos;

    // Línea separadora inferior
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.round(2 * scale);
    ctx.beginPath();
    ctx.moveTo(marginX, ctaY - Math.round(40 * scale));
    ctx.lineTo(canvas.width - marginX, ctaY - Math.round(40 * scale));
    ctx.stroke();

    // Texto del CTA
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.round(36 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("letranido.com", canvas.width / 2, ctaY);

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
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
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
