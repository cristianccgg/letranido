// components/admin/ImageGenerator.jsx - Generador de imágenes para posts de redes sociales
import { useRef, useEffect, useState, useCallback } from "react";

const FONTS_STYLESHEET_ID = "image-generator-fonts";
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,600&family=Libre+Franklin:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap";
const CANVAS_FONTS = [
  '600 100px "Fraunces"',
  'italic 600 100px "Fraunces"',
  '400 100px "Libre Franklin"',
  '500 100px "Libre Franklin"',
  '600 100px "Libre Franklin"',
  '700 100px "Libre Franklin"',
  '700 100px "Space Mono"',
];

// Carga el stylesheet de Google Fonts una sola vez (solo se usa en este tab de admin)
const ensureFontsStylesheet = () => {
  if (document.getElementById(FONTS_STYLESHEET_ID)) return;
  const link = document.createElement("link");
  link.id = FONTS_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = FONTS_HREF;
  document.head.appendChild(link);
};

const ImageGenerator = ({
  post,
  platform = "instagram",
  contest,
  onImageGenerated,
}) => {
  const canvasRef = useRef(null);
  const [fontsReady, setFontsReady] = useState(false);

  // Estados para edición de contenido
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState({
    title: "",
    subtitle: "",
    description: "",
    details: "",
  });

  // Formatos disponibles: cuadrado (feed) y vertical (Stories/Reels)
  const platformConfig = {
    instagram: { width: 1080, height: 1080 },
    facebook: { width: 1080, height: 1080 },
    twitter: { width: 1080, height: 1080 },
    linkedin: { width: 1080, height: 1080 },
    universal: { width: 1080, height: 1080 }, // Formato universal para todas las redes
    story: { width: 1080, height: 1920 }, // Stories / Reels (Instagram, Facebook)
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
        const cleanLine = line.replace(/📚|🗳️|⏰|🎯|✍️|🔥|🚨|🏆|📝|📅|🔗/gu, "").trim();
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

  // Cargar fuentes de Google Fonts (Fraunces, Libre Franklin, Space Mono) una sola vez
  useEffect(() => {
    ensureFontsStylesheet();
    Promise.all(CANVAS_FONTS.map((f) => document.fonts.load(f))).finally(() =>
      setFontsReady(true)
    );
  }, []);

  // Función para dibujar formas orgánicas solo en esquinas diagonales
  // Trazo de tinta orgánico bajo el título (guiño a la escritura a mano)
  const drawInkStroke = (ctx, cx, y, width, color, scale) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.round(10 * scale);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - width / 2, y);
    ctx.bezierCurveTo(
      cx - width / 4,
      y + 14 * scale,
      cx + width / 4,
      y - 14 * scale,
      cx + width / 2,
      y
    );
    ctx.stroke();
    ctx.restore();
  };

  // Chip redondeado con borde/relleno suave para datos (palabras, fecha)
  const drawChip = (ctx, label, x, y, scale, { fill, textColor }) => {
    const chipH = Math.round(54 * scale);
    const padX = Math.round(26 * scale);
    const width = ctx.measureText(label).width + padX * 2;

    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y - chipH + Math.round(16 * scale), width, chipH, 999);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.fillText(label, x + width / 2, y - Math.round(8 * scale));
    ctx.restore();

    return width;
  };

  // Genera la imagen: fondo claro cálido, título en Fraunces itálica, franja índigo con CTA
  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !post) return;

    const ctx = canvas.getContext("2d");
    const config = platformConfig[platform] || platformConfig.universal;
    const vertical = config.height > config.width;

    canvas.width = config.width;
    canvas.height = config.height;

    const scale = canvas.width / 1080;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;

    const paper = "#f6f1ff";
    const indigo = "#4c1d95";
    const violet = "#8b5cf6";
    const inkSoft = "#5b4a86";
    const gold = "#c8862b";

    ctx.clearRect(0, 0, W, H);

    // Fondo papel claro
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    // Lavado violeta suave en la esquina superior izquierda
    const blob = ctx.createRadialGradient(
      W * 0.1,
      H * 0.05,
      0,
      W * 0.1,
      H * 0.05,
      W * 0.55
    );
    blob.addColorStop(0, "rgba(139,92,246,0.22)");
    blob.addColorStop(1, "rgba(139,92,246,0)");
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, W, H * 0.6);

    ctx.textAlign = "center";

    // Función para envolver texto en líneas según el ancho máximo
    const wrapText = (text, maxWidth, font) => {
      ctx.font = font;
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const cleanEmojis = (text) =>
      (text || "").replace(/📚|🗳️|⏰|🎯|✍️|🔥|🚨|🏆|📝|📅|🔗/gu, "").trim();

    // Contenido: usar lo editado si está en modo edición, si no extraer del post
    const eyebrowText = cleanEmojis(
      editableContent.title || post.title
    ).toUpperCase();

    let contestTitle, description, details;
    if (isEditing && editableContent.title) {
      contestTitle = cleanEmojis(editableContent.subtitle).replace(/^"|"$/g, "");
      description = editableContent.description;
      details = editableContent.details ? [editableContent.details] : [];
    } else {
      const postLines = post.content.split("\n").filter((l) => l.trim());
      contestTitle = "";
      description = "";
      details = [];

      for (let i = 0; i < postLines.length; i++) {
        const line = postLines[i].trim();

        if (line.startsWith('"') && line.endsWith('"') && !contestTitle) {
          contestTitle = line.replace(/^"|"$/g, "");
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
          const nextLine = postLines[i + 1]?.trim();
          if (nextLine && !nextLine.includes("📝") && !nextLine.includes("📅") && nextLine.length > 10) {
            description += " " + nextLine;
          }
        }

        if ((line.includes("📝") || line.includes("📅")) && !line.includes("letranido.com")) {
          details.push(cleanEmojis(line));
        }
      }
      if (!contestTitle) {
        contestTitle = editableContent.title || post.title.replace(/🎯|✍️|🔥|⏰|🚨|🗳️|📚|🏆/g, "").trim();
      }
    }

    const maxWidth = W - 200 * scale;

    // Eyebrow centrado
    ctx.fillStyle = gold;
    ctx.font = `700 ${Math.round(26 * scale)}px "Libre Franklin", sans-serif`;
    const eyebrowY = (vertical ? 220 : 150) * scale;
    ctx.fillText(eyebrowText, cx, eyebrowY);

    // Título grande en Fraunces itálica
    ctx.fillStyle = indigo;
    ctx.font = `italic 600 ${Math.round(102 * scale)}px "Fraunces", Georgia, serif`;
    const titleLines = wrapText(contestTitle, maxWidth, ctx.font).slice(0, 2);
    const titleLineHeight = Math.round(108 * scale);
    let titleY = eyebrowY + 120 * scale;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, cx, titleY + i * titleLineHeight);
    });
    const titleBottom = titleY + (titleLines.length - 1) * titleLineHeight;

    // Trazo de tinta bajo el título
    drawInkStroke(ctx, cx, titleBottom + 34 * scale, 420 * scale, violet, scale);

    // Descripción / prompt
    ctx.fillStyle = inkSoft;
    ctx.font = `400 ${Math.round(34 * scale)}px "Libre Franklin", sans-serif`;
    const descLines = description ? wrapText(description, maxWidth, ctx.font) : [];
    let py = titleBottom + (vertical ? 160 : 130) * scale;
    descLines.forEach((line) => {
      ctx.fillText(line, cx, py);
      py += 48 * scale;
    });

    // Chips de datos (palabras, fecha)
    if (details.length > 0) {
      const chipY = py + (vertical ? 100 : 70) * scale;
      ctx.font = `700 ${Math.round(23 * scale)}px "Space Mono", monospace`;
      const widths = details.map(
        (label) => ctx.measureText(label).width + Math.round(26 * scale) * 2
      );
      const chipGap = Math.round(22 * scale);
      const totalW = widths.reduce((a, b) => a + b, 0) + chipGap * (details.length - 1);
      let chipX = cx - totalW / 2;
      details.slice(0, 2).forEach((label) => {
        const w = drawChip(ctx, label, chipX, chipY, scale, {
          fill: "rgba(139,92,246,0.12)",
          textColor: indigo,
        });
        chipX += w + chipGap;
      });
    }

    // Franja inferior sólida con el CTA
    const barH = (vertical ? 170 : 150) * scale;
    ctx.fillStyle = indigo;
    ctx.fillRect(0, H - barH, W, barH);

    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${Math.round(44 * scale)}px "Fraunces", Georgia, serif`;
    ctx.fillText("letranido.com", cx, H - barH / 2 + 8 * scale);

    ctx.fillStyle = "#d7c8fb";
    ctx.font = `500 ${Math.round(22 * scale)}px "Libre Franklin", sans-serif`;
    ctx.fillText("Comparte tu historia con la comunidad", cx, H - barH / 2 + 44 * scale);

    if (onImageGenerated) {
      onImageGenerated(canvas.toDataURL("image/png"));
    }
  };

  // Generar imagen cuando cambie el post, plataforma, contest, o cuando las fuentes terminen de cargar
  useEffect(() => {
    if (post && fontsReady) {
      setTimeout(generateImage, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, platform, contest, fontsReady]);

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
                  Eyebrow (línea pequeña arriba del título):
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
                  Título del reto (será el título grande de la imagen):
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
