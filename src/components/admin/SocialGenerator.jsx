// components/admin/SocialGenerator.jsx - Generador automático de posts para redes sociales
import { useState } from 'react';
import { Share2, Copy, CheckCircle, Calendar, Sparkles, Image, Download, ClipboardList } from 'lucide-react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import ImageGenerator from './ImageGenerator';

const SocialGenerator = () => {
  const { currentContest, nextContest, contests } = useGlobalApp();
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [showImageFor, setShowImageFor] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [selectedContestOption, setSelectedContestOption] = useState('current');
  const [imageFormats, setImageFormats] = useState({}); // { [postId]: 'universal' | 'story' }
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [downloadingBatch, setDownloadingBatch] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [pendingGenerationIds, setPendingGenerationIds] = useState([]);

  // Obtener reto seleccionado según la opción
  const getSelectedContest = () => {
    switch (selectedContestOption) {
      case 'current':
        return currentContest;
      case 'next':
        return nextContest;
      case 'previous':
        // Buscar el reto más reciente que ya fue finalizado
        if (contests && contests.length > 0) {
          const finalized = contests
            .filter(c => c.finalized_at !== null)
            .sort((a, b) => new Date(b.finalized_at) - new Date(a.finalized_at));
          return finalized[0] || null;
        }
        return null;
      default:
        return currentContest;
    }
  };

  // Obtener opciones de reto disponibles
  const getContestOptions = () => {
    const options = [];
    
    if (currentContest) {
      options.push({
        value: 'current',
        label: `📍 Reto Actual: "${currentContest.title}"`,
        contest: currentContest
      });
    }
    
    if (nextContest) {
      options.push({
        value: 'next', 
        label: `⏭️ Próximo Reto: "${nextContest.title}"`,
        contest: nextContest
      });
    }
    
    // Agregar reto anterior si existe
    if (contests && contests.length > 0) {
      const finalized = contests
        .filter(c => c.finalized_at !== null)
        .sort((a, b) => new Date(b.finalized_at) - new Date(a.finalized_at));
      
      if (finalized[0]) {
        options.push({
          value: 'previous',
          label: `📚 Reto Anterior: "${finalized[0].title}"`,
          contest: finalized[0]
        });
      }
    }
    
    return options;
  };

  // Generar posts del mes completo
  const generateMonthlyPosts = async () => {
    setLoading(true);
    try {
      const contest = getSelectedContest();
      if (!contest) {
        alert('No hay reto disponible para generar posts');
        return;
      }

      const posts = await generateContestPosts(contest);
      setGeneratedPosts(posts);
      // Pre-selecciona solo los posts cuya fecha calculada ya pasó o cae
      // dentro de los próximos 3 días, para no tener que pensar fechas a mano
      const duePosts = posts.filter(p => isPostDue(p.scheduledDate));
      setSelectedPostIds((duePosts.length > 0 ? duePosts : posts).map(p => p.id));

      // Limpiar imágenes generadas al cambiar reto
      setGeneratedImages({});
      setShowImageFor(null);
    } catch (error) {
      console.error('Error generando posts:', error);
      alert('Error generando posts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcula la fecha/hora concreta de publicación de cada uno de los 8 posts,
  // a partir de submission_deadline y voting_deadline del reto (offsets reales,
  // no días fijos de calendario, para que funcione aunque el reto no siga la
  // convención de "cierre el 26").
  const calculatePostDates = (contest) => {
    const DAY = 24 * 60 * 60 * 1000;
    const submission = contest.submission_deadline ? new Date(contest.submission_deadline) : null;
    const voting = contest.voting_deadline ? new Date(contest.voting_deadline) : null;
    const created = contest.created_at ? new Date(contest.created_at) : null;

    // Ancla de "inicio del reto": created_at si existe, si no ~22 días antes del cierre de envíos
    const start = created || (submission ? new Date(submission.getTime() - 22 * DAY) : new Date());

    const votingMid = submission && voting
      ? new Date((submission.getTime() + voting.getTime()) / 2)
      : null;

    return {
      1: new Date(start.getTime() + 1 * DAY), // Nuevo reto: día 1
      2: new Date(start.getTime() + 5 * DAY), // Tips: día 5
      3: new Date(start.getTime() + 10 * DAY), // Motivación: día 10
      4: submission ? new Date(submission.getTime() - 5 * DAY) : null, // Recordatorio: -5 días del cierre
      5: submission ? new Date(submission.getTime() - 1 * DAY) : null, // Última llamada: -24h del cierre
      6: submission, // Votación iniciada: justo al cerrar envíos
      7: votingMid, // Lee las historias: mitad de la votación
      8: voting, // Resultados: al cerrar votación
    };
  };

  // Función principal para generar posts basados en las fases del reto
  const generateContestPosts = async (contest) => {
    const posts = [];
    const dates = calculatePostDates(contest);

    const deadlineStr = contest.submission_deadline
      ? new Date(contest.submission_deadline).toLocaleDateString('es-ES')
      : '';
    const wordsStr = contest.min_words && contest.max_words
      ? `📝 ${contest.min_words}-${contest.max_words} palabras`
      : '';
    const dateChip = deadlineStr ? `📅 ${deadlineStr}` : '';

    // Post 1: Anuncio del nuevo reto
    posts.push({
      id: 1,
      title: '✍️ Nuevo Reto de Escritura',
      content: generateNewContestPost(contest),
      scheduledDate: dates[1],
      type: 'new_contest',
      hashtags: generateHashtags(['reto', 'escritura', 'concurso']),
      image: {
        eyebrow: 'Nuevo Reto',
        description: contest.description || 'Un nuevo desafío te espera. Anímate a escribir tu historia.',
        details: [wordsStr, dateChip].filter(Boolean)
      }
    });

    // Post 2: Tips de escritura
    posts.push({
      id: 2,
      title: '✍️ Tips de Escritura',
      content: generateWritingTipsPost(contest),
      scheduledDate: dates[2],
      type: 'tips',
      hashtags: generateHashtags(['tips', 'escritura', 'creatividad']),
      image: {
        eyebrow: 'Tip de Escritura',
        description: 'Un consejo rápido para avanzar con tu historia del reto activo.',
        details: [dateChip].filter(Boolean)
      }
    });

    // Post 3: Motivación a mitad de mes
    posts.push({
      id: 3,
      title: '🔥 Motivación de Mitad de Mes',
      content: generateMotivationPost(contest),
      scheduledDate: dates[3],
      type: 'motivation',
      hashtags: generateHashtags(['motivacion', 'escritura', 'creatividad']),
      image: {
        eyebrow: 'Seguí Escribiendo',
        description: 'Aún hay tiempo para terminar tu historia y compartirla con la comunidad.',
        details: [dateChip].filter(Boolean)
      }
    });

    // Post 4: Recordatorio de envío
    posts.push({
      id: 4,
      title: '⏰ Recordatorio de Envío',
      content: generateReminderPost(contest),
      scheduledDate: dates[4],
      type: 'reminder',
      hashtags: generateHashtags(['ultimosdias', 'envio', 'deadline']),
      image: {
        eyebrow: 'Quedan 5 Días',
        description: 'El envío de historias está por cerrar. Dale los últimos toques a la tuya.',
        details: [dateChip].filter(Boolean)
      }
    });

    // Post 5: Última llamada
    posts.push({
      id: 5,
      title: '🚨 Última Llamada',
      content: generateLastCallPost(contest),
      scheduledDate: dates[5],
      type: 'last_call',
      hashtags: generateHashtags(['ultimahora', 'deadline', 'urgente']),
      image: {
        eyebrow: 'Últimas 24 Horas',
        description: 'Es tu última oportunidad para enviar tu historia a este reto.',
        details: [dateChip].filter(Boolean)
      }
    });

    // Post 6: Votación iniciada
    posts.push({
      id: 6,
      title: '🗳️ Votación Iniciada',
      content: generateVotingStartPost(contest),
      scheduledDate: dates[6],
      type: 'voting_start',
      hashtags: generateHashtags(['votacion', 'historias', 'comunidad']),
      image: {
        eyebrow: 'Votación Abierta',
        description: 'Ya podés leer las historias del reto y votar por tus favoritas.',
        details: []
      }
    });

    // Post 7: Animar a leer historias
    posts.push({
      id: 7,
      title: '📚 Lee las Historias',
      content: generateReadStoriesPost(contest),
      scheduledDate: dates[7],
      type: 'read_stories',
      hashtags: generateHashtags(['lectura', 'historias', 'vota']),
      image: {
        eyebrow: '¿Ya Las Leíste?',
        description: 'Descubre las historias del reto: mismo prompt, mundos completamente distintos.',
        details: []
      }
    });

    // Post 8: Resultados
    posts.push({
      id: 8,
      title: '🏆 Resultados',
      content: generateResultsPost(contest),
      scheduledDate: dates[8],
      type: 'results',
      hashtags: generateHashtags(['resultados', 'ganadores', 'celebracion']),
      image: {
        eyebrow: 'Resultados',
        description: 'Ya tenemos los resultados del reto. Entra a letranido y descubre las historias más votadas por la comunidad.',
        details: []
      }
    });

    return posts.sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0));
  };

  // Formatea la fecha calculada para mostrarla, indicando si ya pasó
  const formatScheduledDate = (date) => {
    if (!date) return 'Sin fecha calculada';
    const isPast = date.getTime() < Date.now();
    const formatted = date.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    return isPast ? `${formatted} (ya pasó)` : formatted;
  };

  // Un post "toca publicarlo ahora" si su fecha calculada ya pasó o cae
  // dentro de los próximos 3 días — así no hay que pensar fechas a mano.
  const isPostDue = (date) => {
    if (!date) return false;
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    return date.getTime() <= Date.now() + THREE_DAYS;
  };

  // Generar post de nuevo concurso
  const generateNewContestPost = (contest) => {
    return `🎯 NUEVO RETO

"${contest.title}"

${contest.description}

📝 ${contest.min_words}-${contest.max_words} palabras
📅 Hasta el ${new Date(contest.submission_deadline).toLocaleDateString('es-ES')}

¿Te animas? 👇

✍️ letranido.com`;
  };

  // Generar post de tips
  const generateWritingTipsPost = (contest) => {
    const tips = [
      '🎯 Lee el prompt varias veces y busca diferentes interpretaciones',
      '💡 Empieza con una imagen o emoción, no con la trama',
      '⏱️ Escribe el primer borrador sin parar, edita después',
      '🎭 Dale voz única a tu narrador',
      '✨ El final debe resonar con el inicio'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return `💡 TIP RÁPIDO

${randomTip}

¿Cuál es tu truco contra el bloqueo creativo? Contanos 👇

Reto activo: "${contest.title}"
✍️ letranido.com`;
  };

  // Generar post motivacional
  const generateMotivationPost = (contest) => {
    return `🔥 ¿YA ESCRIBISTE LA TUYA?

"${contest.title}" te está esperando.

✨ No existe la historia perfecta, solo la terminada
💫 Tu voz es única

⏰ Aún hay tiempo. Andá por ella.

📝 letranido.com`;
  };

  // Generar post de recordatorio
  const generateReminderPost = (contest) => {
    return `⏰ QUEDAN 5 DÍAS

"${contest.title}"
📅 Cierra el ${new Date(contest.submission_deadline).toLocaleDateString('es-ES')}

¿Ya la tenés lista? Dale esos últimos toques 🖊️

✍️ letranido.com`;
  };

  // Generar post de última llamada
  const generateLastCallPost = (contest) => {
    return `🚨 ÚLTIMAS 24 HORAS

"${contest.title}"

¿A medias? Terminala.
¿Solo una idea? Escribila.
¿Nada aún? Este es el momento.

⚡ letranido.com`;
  };

  // Generar post de inicio de votación
  const generateVotingStartPost = (contest) => {
    return `🗳️ ¡VOTACIÓN ABIERTA!

Las historias de "${contest.title}" ya están listas.

📚 Leé
❤️ Votá tus favoritas
💬 Comentá

Tu voto cuenta 👇

🔗 letranido.com`;
  };

  // Generar post para animar a leer
  const generateReadStoriesPost = (contest) => {
    return `📚 ¿YA LEÍSTE TODAS?

"${contest.title}" tiene historias que te van a sorprender.

🌟 Mismo prompt, mundos distintos
🎭 Un estilo por cada autor/a

¿Cuál es tu favorita?

👀 letranido.com`;
  };

  // Generar post de resultados
  const generateResultsPost = (contest) => {
    return `🏆 ¡YA HAY RESULTADOS!

"${contest.title}" llegó a su fin.

✨ Las historias más votadas
🎉 Felicidades a todos los que participaron

Ver el podio 👇

🎉 letranido.com`;
  };

  // Generar hashtags universal (optimizado para Instagram pero funciona en todas)
  const generateHashtags = (keywords) => {
    const baseHashtags = ['#letranido', '#escritura', '#retos', '#comunidad'];
    const keywordHashtags = keywords.map(k => `#${k}`);

    const allHashtags = [...baseHashtags, ...keywordHashtags];

    // Máximo 10 hashtags (ideal para Instagram)
    return allHashtags.slice(0, 10).join(' ');
  };

  // Copiar al portapapeles
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Error copiando:', error);
    }
  };

  // Manejar generación de imagen
  const handleImageGenerated = (postId, imageDataUrl) => {
    setGeneratedImages(prev => ({
      ...prev,
      [postId]: imageDataUrl
    }));
  };

  // Descargar imagen
  const downloadImage = (post) => {
    const imageData = generatedImages[post.id];
    if (!imageData) return;

    const link = document.createElement('a');
    link.download = `${post.id}-${post.type}-letranido.png`;
    link.href = imageData;
    link.click();
  };

  // Toggle mostrar/ocultar imagen
  const toggleImagePreview = (postId) => {
    setShowImageFor(showImageFor === postId ? null : postId);
  };

  // Toggle selección de un post
  const togglePostSelected = (postId) => {
    setSelectedPostIds(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const selectAllPosts = () => setSelectedPostIds(generatedPosts.map(p => p.id));
  const deselectAllPosts = () => setSelectedPostIds([]);

  // Copiar todos los posts seleccionados como JSON en un solo bloque
  const copySelectedAsJson = async () => {
    const selected = generatedPosts.filter(p => selectedPostIds.includes(p.id));
    const payload = selected.map(post => ({
      id: post.id,
      type: post.type,
      title: post.title,
      scheduledFor: post.scheduledDate ? post.scheduledDate.toISOString() : null,
      content: post.content,
      hashtags: post.hashtags
    }));

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    } catch (error) {
      console.error('Error copiando JSON en bloque:', error);
    }
  };

  // Genera (si hace falta) y descarga las imágenes de los posts seleccionados,
  // una tras otra, con el id en el nombre del archivo para poder referenciarlas
  // después por URL una vez subidas a Supabase Storage.
  const downloadSelectedImages = async () => {
    const selected = generatedPosts.filter(p => selectedPostIds.includes(p.id));
    const missingIds = selected.filter(p => !generatedImages[p.id]).map(p => p.id);
    let latestImages = generatedImages;

    if (missingIds.length > 0) {
      setGeneratingBatch(true);
      setPendingGenerationIds(missingIds);
      // Espera a que los ImageGenerator ocultos generen las imágenes faltantes
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          setGeneratedImages((current) => {
            latestImages = current;
            if (missingIds.every((id) => current[id])) {
              clearInterval(checkInterval);
              resolve();
            }
            return current;
          });
        }, 200);
        // Salvaguarda: no esperar más de 15s por si alguna imagen falla
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 15000);
      });
      setGeneratingBatch(false);
      setPendingGenerationIds([]);
    }

    setDownloadingBatch(true);
    try {
      for (const post of selected) {
        const imageData = latestImages[post.id];
        if (!imageData) continue;
        const link = document.createElement('a');
        link.download = `${post.id}-${post.type}-letranido.png`;
        link.href = imageData;
        link.click();
        // Pequeña pausa para que el navegador no bloquee descargas múltiples
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } finally {
      setDownloadingBatch(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Generador de Redes Sociales</h2>
          <p className="text-gray-600">Genera posts automáticos para todo el mes</p>
        </div>
      </div>

      {/* Selector de Reto */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Selecciona el reto:</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <select
            value={selectedContestOption}
            onChange={(e) => {
              setSelectedContestOption(e.target.value);
              // Limpiar posts y estados al cambiar reto
              setGeneratedPosts([]);
              setGeneratedImages({});
              setShowImageFor(null);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {getContestOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {getSelectedContest() && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Reto seleccionado:</strong> "{getSelectedContest().title}"
              </div>
              <div className="text-xs text-blue-600 mt-1">
                📝 {getSelectedContest().min_words} - {getSelectedContest().max_words} palabras
                {getSelectedContest().submission_deadline && (
                  <span className="ml-3">
                    📅 Hasta: {new Date(getSelectedContest().submission_deadline).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {!getSelectedContest() && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-800">
                ⚠️ No hay reto disponible para la opción seleccionada
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Generar */}
      <div className="mb-6">
        <button
          onClick={generateMonthlyPosts}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generando posts...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              Generar Posts del Mes
            </div>
          )}
        </button>
      </div>

      {/* Posts Generados */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-700" />
            Posts Generados ({generatedPosts.length})
          </h3>

          {/* Barra de acciones en bloque */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-purple-900">
              {selectedPostIds.length} de {generatedPosts.length} seleccionados
            </span>
            <button
              onClick={selectAllPosts}
              className="text-xs text-purple-700 underline hover:text-purple-900"
            >
              Seleccionar todos
            </button>
            <button
              onClick={deselectAllPosts}
              className="text-xs text-purple-700 underline hover:text-purple-900"
            >
              Deseleccionar todos
            </button>

            <div className="flex-1" />

            <button
              onClick={copySelectedAsJson}
              disabled={selectedPostIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition-all"
            >
              {copiedBatch ? <CheckCircle className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
              {copiedBatch ? 'JSON copiado' : 'Copiar Todo como JSON'}
            </button>

            <button
              onClick={downloadSelectedImages}
              disabled={selectedPostIds.length === 0 || downloadingBatch || generatingBatch}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-all"
            >
              <Download className="w-4 h-4" />
              {generatingBatch
                ? 'Generando imágenes...'
                : downloadingBatch
                  ? 'Descargando...'
                  : `Generar y Descargar Imágenes (${selectedPostIds.length})`}
            </button>
          </div>

          {/* Genera en segundo plano (sin mostrar preview) las imágenes que aún
              faltan para los posts seleccionados, para la descarga en bloque */}
          {pendingGenerationIds.length > 0 && (
            <div className="hidden">
              {generatedPosts
                .filter((post) => pendingGenerationIds.includes(post.id) && !generatedImages[post.id])
                .map((post) => (
                  <ImageGenerator
                    key={post.id}
                    post={post}
                    platform={imageFormats[post.id] || 'universal'}
                    contest={getSelectedContest()}
                    onImageGenerated={(imageDataUrl) => handleImageGenerated(post.id, imageDataUrl)}
                  />
                ))}
            </div>
          )}

          {generatedPosts.map((post, index) => (
            <div key={post.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPostIds.includes(post.id)}
                    onChange={() => togglePostSelected(post.id)}
                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{post.title}</h4>
                    <p className={`text-sm ${post.scheduledDate && post.scheduledDate.getTime() < Date.now() ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                      📅 {formatScheduledDate(post.scheduledDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleImagePreview(post.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                  >
                    <Image className="w-4 h-4" />
                    {showImageFor === post.id ? 'Ocultar' : 'Imagen'}
                  </button>
                  {generatedImages[post.id] && (
                    <button
                      onClick={() => downloadImage(post)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(post.content + (post.hashtags ? '\n\n' + post.hashtags : ''), index)}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                  {post.content}
                </pre>
                {post.hashtags && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-purple-600 font-medium">{post.hashtags}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Caracteres: {(post.content + (post.hashtags ? '\n\n' + post.hashtags : '')).length}
              </div>

              {/* Generador de imagen */}
              {showImageFor === post.id && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Imagen para Redes Sociales
                    </h5>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setImageFormats((prev) => ({ ...prev, [post.id]: 'universal' }))}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          (imageFormats[post.id] || 'universal') === 'universal'
                            ? 'bg-white text-purple-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Cuadrado (Feed)
                      </button>
                      <button
                        onClick={() => setImageFormats((prev) => ({ ...prev, [post.id]: 'story' }))}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          imageFormats[post.id] === 'story'
                            ? 'bg-white text-purple-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Vertical (Stories)
                      </button>
                    </div>
                  </div>
                  <ImageGenerator
                    post={post}
                    platform={imageFormats[post.id] || 'universal'}
                    contest={getSelectedContest()}
                    onImageGenerated={(imageDataUrl) => handleImageGenerated(post.id, imageDataUrl)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ayuda */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Cómo usar:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. <strong>Selecciona el reto:</strong> Actual, próximo o anterior</li>
          <li>2. Haz clic en "Generar Posts del Mes" — se calculan las 8 fechas según el cierre real del reto</li>
          <li>3. Se pre-seleccionan solo los posts que ya tocan o vencen en los próximos 3 días. Ajusta los checkboxes si quieres otros</li>
          <li>4. Haz clic en "Generar y Descargar Imágenes" — genera automáticamente las que falten y descarga todas las seleccionadas (el nombre del archivo lleva el id del post, ej. "7-read_stories-letranido.png")</li>
          <li>5. Usa "Copiar Todo como JSON" para copiar el texto y la fecha sugerida de los posts seleccionados en un solo bloque</li>
          <li>6. Sube las imágenes al bucket de Supabase y pega el JSON + URLs (con su id) en el chat con Claude para crear los borradores en Buffer</li>
        </ul>
        <div className="mt-3 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <strong>✨ Funcionalidades:</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>Selector de reto:</strong> Cambia entre actual, próximo o anterior según tu estrategia</li>
            <li>• <strong>Imágenes universales:</strong> Formato 1080x1080 optimizado para todas las redes sociales</li>
            <li>• <strong>Contenido inteligente:</strong> Extrae información real del reto seleccionado</li>
            <li>• <strong>Multi-plataforma:</strong> Posts funcionan en Instagram, Twitter, Facebook, LinkedIn</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SocialGenerator;