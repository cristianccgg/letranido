// components/admin/ImageGenerator.jsx - Generador de imágenes para posts de redes sociales
import { useRef, useEffect } from 'react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';

const ImageGenerator = ({ post, platform = 'instagram', onImageGenerated }) => {
  const { currentContest, nextContest } = useGlobalApp();
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

    // Obtener información del reto actual
    const contest = currentContest || nextContest;
    
    // Contenido principal basado en el tipo de post y reto actual
    let mainContent = '';
    let additionalInfo = '';
    
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `${Math.round(28 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    
    // Generar contenido específico por tipo de post
    switch (post.type) {
      case 'new_contest':
        if (contest) {
          mainContent = `"${contest.title}"`;
          additionalInfo = `${contest.min_words} - ${contest.max_words} palabras`;
        } else {
          mainContent = '"¡Nuevo reto de escritura disponible!"';
        }
        break;
        
      case 'tips':
        mainContent = '"Mejora tu escritura con estos consejos"';
        if (contest) {
          additionalInfo = `Para el reto: "${contest.title}"`;
        }
        break;
        
      case 'motivation':
        if (contest) {
          mainContent = `"¿Ya empezaste tu historia para ${contest.title}?"`;
        } else {
          mainContent = '"¡Es tu momento de brillar como escritor!"';
        }
        break;
        
      case 'reminder':
        if (contest) {
          mainContent = '"¡Últimos días para participar!"';
          const deadline = new Date(contest.submission_deadline);
          additionalInfo = `Hasta: ${deadline.toLocaleDateString('es-ES')}`;
        } else {
          mainContent = '"¡No te quedes sin participar!"';
        }
        break;
        
      case 'last_call':
        if (contest) {
          mainContent = '"¡Última llamada!"';
          additionalInfo = `"${contest.title}"`;
        } else {
          mainContent = '"¡Última oportunidad de participar!"';
        }
        break;
        
      case 'voting_start':
        if (contest) {
          mainContent = '"¡La votación ha comenzado!"';
          additionalInfo = `Lee y vota las historias de "${contest.title}"`;
        } else {
          mainContent = '"¡Hora de votar por las mejores historias!"';
        }
        break;
        
      case 'read_stories':
        if (contest) {
          mainContent = '"¿Ya leíste las historias increíbles?"';
          additionalInfo = `Del reto: "${contest.title}"`;
        } else {
          mainContent = '"Descubre historias increíbles"';
        }
        break;
        
      case 'results':
        if (contest) {
          mainContent = '"¡Ya tenemos ganadores!"';
          additionalInfo = `Resultados de "${contest.title}"`;
        } else {
          mainContent = '"¡Resultados disponibles!"';
        }
        break;
        
      default:
        mainContent = '"¡Únete a nuestra comunidad de escritores!"';
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
    let currentY = titleY + Math.round(100 * scale);
    
    // Mostrar contenido principal
    ctx.fillStyle = '#ffffff';
    const mainLines = wrapText(mainContent, maxWidth, 28);
    const mainLineHeight = Math.round(36 * scale);
    
    mainLines.slice(0, 2).forEach((line, index) => {
      ctx.font = `${Math.round(28 * scale)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(line, canvas.width / 2, currentY + (index * mainLineHeight));
    });
    
    currentY += mainLines.slice(0, 2).length * mainLineHeight + Math.round(30 * scale);
    
    // Mostrar información adicional si existe
    if (additionalInfo) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `${Math.round(22 * scale)}px system-ui, -apple-system, sans-serif`;
      const additionalLines = wrapText(additionalInfo, maxWidth, 22);
      const additionalLineHeight = Math.round(28 * scale);
      
      additionalLines.slice(0, 2).forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, currentY + (index * additionalLineHeight));
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