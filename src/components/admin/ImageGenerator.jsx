// components/admin/ImageGenerator.jsx - Generador de imágenes para posts de redes sociales
import { useRef, useEffect } from 'react';

const ImageGenerator = ({ post, platform = 'instagram', onImageGenerated }) => {
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

    // Contenido principal (extracto)
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `${Math.round(32 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    
    // Extraer las primeras líneas del contenido
    const contentLines = post.content.split('\n').filter(line => line.trim());
    let mainContent = '';
    
    // Buscar una línea significativa (que no sea solo emojis o muy corta)
    for (const line of contentLines) {
      // Usar un enfoque más simple para limpiar emojis
      const cleanLine = line.replace(/[\u{1F000}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
      if (cleanLine.length > 20 && cleanLine.length < 80) {
        mainContent = `"${cleanLine}"`;
        break;
      }
    }
    
    // Fallback si no encontramos contenido adecuado
    if (!mainContent) {
      const fallbacks = {
        new_contest: '"¡Nuevo reto de escritura disponible!"',
        tips: '"Consejos para mejorar tu escritura"',
        motivation: '"¡Es tu momento de brillar!"',
        reminder: '"Últimos días para participar"',
        last_call: '"¡Última oportunidad!"',
        voting_start: '"¡La votación ha comenzado!"',
        read_stories: '"Descubre historias increíbles"',
        results: '"¡Ya tenemos ganadores!"'
      };
      mainContent = fallbacks[post.type] || '"¡Únete a nuestra comunidad!"';
    }

    // Dividir texto en líneas si es muy largo
    const maxWidth = canvas.width - (marginX * 2);
    const words = mainContent.split(' ');
    const lines = [];
    let currentLine = '';

    ctx.font = `${Math.round(28 * scale)}px system-ui, -apple-system, sans-serif`;
    
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

    // Mostrar máximo 3 líneas
    const displayLines = lines.slice(0, 3);
    const lineHeight = Math.round(40 * scale);
    const startY = titleY + Math.round(100 * scale);

    displayLines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(line, canvas.width / 2, y);
    });

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

  // Generar imagen cuando cambie el post o la plataforma
  useEffect(() => {
    if (post) {
      // Pequeño delay para asegurar que el canvas esté listo
      setTimeout(generateImage, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, platform]);

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