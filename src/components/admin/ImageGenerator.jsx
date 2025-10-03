// components/admin/ImageGenerator.jsx - Generador de imágenes para posts de redes sociales
import { useRef, useEffect } from 'react';

const ImageGenerator = ({ post, platform = 'instagram', contest, onImageGenerated }) => {
  const canvasRef = useRef(null);

  // Configuraciones por plataforma
  const platformConfig = {
    instagram: { width: 1080, height: 1080 },
    facebook: { width: 1200, height: 630 },
    twitter: { width: 1200, height: 675 },
    linkedin: { width: 1200, height: 627 }
  };

  // Mapeo de emojis por tipo de post
  const postEmojis = {
    new_contest: '🎯',
    tips: '✍️',
    motivation: '🔥',
    reminder: '⏰',
    last_call: '🚨',
    voting_start: '🗳️',
    read_stories: '📚',
    results: '🏆'
  };

  // Generar imagen
  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !post) return;

    const ctx = canvas.getContext('2d');
    const config = platformConfig[platform];
    
    // Configurar canvas
    canvas.width = config.width;
    canvas.height = config.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#6366f1'); // Purple
    gradient.addColorStop(0.5, '#8b5cf6'); // Purple-pink
    gradient.addColorStop(1, '#ec4899'); // Pink
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configuraciones de texto
    const isSquare = platform === 'instagram';
    const baseSize = isSquare ? 1080 : 1200;
    const scale = canvas.width / baseSize;

    // Header - Logo y marca
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(48 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    
    const headerY = Math.round(80 * scale);
    const marginX = Math.round(60 * scale);
    
    // Logo emoji
    ctx.font = `${Math.round(40 * scale)}px system-ui`;
    ctx.fillText('🪶', marginX, headerY);
    
    // Texto "LETRANIDO"
    ctx.font = `bold ${Math.round(48 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('LETRANIDO', marginX + Math.round(60 * scale), headerY);

    // Línea separadora
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.round(2 * scale);
    ctx.beginPath();
    ctx.moveTo(marginX, headerY + Math.round(30 * scale));
    ctx.lineTo(canvas.width - marginX, headerY + Math.round(30 * scale));
    ctx.stroke();

    // Emoji del tipo de post
    const postEmoji = postEmojis[post.type] || '✨';
    ctx.font = `${Math.round(80 * scale)}px system-ui`;
    ctx.textAlign = 'center';
    
    const emojiY = isSquare ? Math.round(250 * scale) : Math.round(200 * scale);
    ctx.fillText(postEmoji, canvas.width / 2, emojiY);

    // Título del post
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(42 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    
    const titleY = emojiY + Math.round(80 * scale);
    const title = post.title.replace(/🎯|✍️|🔥|⏰|🚨|🗳️|📚|🏆/g, '').trim();
    ctx.fillText(title, canvas.width / 2, titleY);

    // Extraer contenido directamente del post
    const postLines = post.content.split('\n').filter(line => line.trim());
    
    // Extraer elementos clave del post
    let postTitle = '';
    let contestTitle = '';
    let description = '';
    let details = [];
    let callToAction = '';
    
    // Buscar elementos específicos en el contenido del post
    for (let i = 0; i < postLines.length; i++) {
      const line = postLines[i].trim();
      
      // Título principal del post (primera línea con emojis de reto)
      if (line.includes('🎯') && line.includes('RETO') && !postTitle) {
        postTitle = line.replace(/🎯/g, '').trim();
      }
      
      // Título del reto (línea entre comillas)
      if (line.startsWith('"') && line.endsWith('"') && !contestTitle) {
        contestTitle = line;
      }
      
      // Descripción (líneas de texto normal, no emojis ni detalles técnicos)
      if (!line.includes('📝') && !line.includes('📅') && !line.includes('✍️') && 
          !line.includes('🎯') && !line.includes('🏆') && !line.includes('🔗') &&
          line.length > 20 && !line.startsWith('"') && !description) {
        // Tomar esta línea y posiblemente la siguiente como descripción
        description = line;
        if (i + 1 < postLines.length) {
          const nextLine = postLines[i + 1].trim();
          if (!nextLine.includes('📝') && !nextLine.includes('📅') && nextLine.length > 10) {
            description += ' ' + nextLine;
          }
        }
      }
      
      // Detalles técnicos (líneas con emojis de datos)
      if ((line.includes('📝') || line.includes('📅')) && !line.includes('letranido.com')) {
        details.push(line);
      }
      
      // Call to action
      if (line.includes('letranido.com') || (line.includes('✍️') && line.includes('Participa'))) {
        callToAction = line;
      }
    }

    // Función para dividir texto en líneas
    const wrapText = (text, maxWidth, fontSize) => {
      ctx.font = `${Math.round(fontSize * scale)}px system-ui, -apple-system, sans-serif`;
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
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

    const maxWidth = canvas.width - (marginX * 2);
    let currentY = titleY + Math.round(60 * scale);
    
    // 1. Título principal del post (ej: "¡NUEVO RETO DE ESCRITURA!")
    if (postTitle) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(32 * scale)}px system-ui, -apple-system, sans-serif`;
      const titleLines = wrapText(postTitle, maxWidth, 32);
      
      titleLines.slice(0, 2).forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * Math.round(40 * scale)));
      });
      currentY += titleLines.slice(0, 2).length * Math.round(40 * scale) + Math.round(25 * scale);
    }
    
    // 2. Título del reto (ej: "El último día de...")
    if (contestTitle) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `bold ${Math.round(28 * scale)}px system-ui, -apple-system, sans-serif`;
      const contestLines = wrapText(contestTitle, maxWidth, 28);
      
      contestLines.slice(0, 1).forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * Math.round(35 * scale)));
      });
      currentY += contestLines.slice(0, 1).length * Math.round(35 * scale) + Math.round(20 * scale);
    }
    
    // 3. Descripción del reto
    if (description) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `${Math.round(22 * scale)}px system-ui, -apple-system, sans-serif`;
      // Limitar descripción para que no ocupe todo el espacio
      const shortDesc = description.length > 120 ? description.substring(0, 120) + '...' : description;
      const descLines = wrapText(shortDesc, maxWidth, 22);
      
      descLines.slice(0, 3).forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * Math.round(28 * scale)));
      });
      currentY += descLines.slice(0, 3).length * Math.round(28 * scale) + Math.round(25 * scale);
    }
    
    // 4. Detalles técnicos (palabras, fecha)
    if (details.length > 0) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `${Math.round(20 * scale)}px system-ui, -apple-system, sans-serif`;
      
      details.slice(0, 2).forEach((detail, index) => {
        ctx.fillText(detail, canvas.width / 2, currentY + (index * Math.round(26 * scale)));
      });
    }

    // Call to action
    const ctaY = isSquare ? canvas.height - Math.round(120 * scale) : canvas.height - Math.round(80 * scale);
    
    // Línea separadora inferior
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.round(2 * scale);
    ctx.beginPath();
    ctx.moveTo(marginX, ctaY - Math.round(40 * scale));
    ctx.lineTo(canvas.width - marginX, ctaY - Math.round(40 * scale));
    ctx.stroke();
    
    // Texto del CTA
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(36 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('letranido.com', canvas.width / 2, ctaY);

    // Notificar que la imagen está lista
    if (onImageGenerated) {
      onImageGenerated(canvas.toDataURL('image/png'));
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

    const link = document.createElement('a');
    link.download = `${post.type}-${platform}-letranido.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="image-generator">
      <canvas 
        ref={canvasRef}
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}
      />
      
      {post && (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Dimensiones: {platformConfig[platform].width} x {platformConfig[platform].height}
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