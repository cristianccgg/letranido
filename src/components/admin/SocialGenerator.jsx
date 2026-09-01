// components/admin/SocialGenerator.jsx - Generador automático de posts para redes sociales
import { useState } from 'react';
import { Share2, Copy, CheckCircle, Calendar, Sparkles, Image, Download } from 'lucide-react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';
import ImageGenerator from './ImageGenerator';

const SocialGenerator = () => {
  const { currentContest, nextContest, contests } = useGlobalApp();
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showImageFor, setShowImageFor] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [selectedContestOption, setSelectedContestOption] = useState('current');
  const [imageFormats, setImageFormats] = useState({}); // { [postId]: 'universal' | 'story' }

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

  // Función principal para generar posts basados en las fases del reto
  const generateContestPosts = async (contest) => {
    const posts = [];
    
    // Post 1: Anuncio del nuevo reto
    posts.push({
      id: 1,
      title: '✍️ Nuevo Reto de Escritura',
      content: generateNewContestPost(contest),
      scheduledFor: 'Día 1 del mes',
      type: 'new_contest',
      hashtags: generateHashtags(['reto', 'escritura', 'concurso'])
    });

    // Post 2: Tips de escritura
    posts.push({
      id: 2,
      title: '✍️ Tips de Escritura',
      content: generateWritingTipsPost(contest),
      scheduledFor: 'Día 5 del mes',
      type: 'tips',
      hashtags: generateHashtags(['tips', 'escritura', 'creatividad'])
    });

    // Post 3: Motivación a mitad de mes
    posts.push({
      id: 3,
      title: '🔥 Motivación de Mitad de Mes',
      content: generateMotivationPost(contest),
      scheduledFor: 'Día 10 del mes',
      type: 'motivation',
      hashtags: generateHashtags(['motivacion', 'escritura', 'creatividad'])
    });

    // Post 4: Recordatorio de envío
    posts.push({
      id: 4,
      title: '⏰ Recordatorio de Envío',
      content: generateReminderPost(contest),
      scheduledFor: '5 días antes del cierre',
      type: 'reminder',
      hashtags: generateHashtags(['ultimosdias', 'envio', 'deadline'])
    });

    // Post 5: Última llamada
    posts.push({
      id: 5,
      title: '🚨 Última Llamada',
      content: generateLastCallPost(contest),
      scheduledFor: '24 horas antes del cierre',
      type: 'last_call',
      hashtags: generateHashtags(['ultimahora', 'deadline', 'urgente'])
    });

    // Post 6: Votación iniciada
    posts.push({
      id: 6,
      title: '🗳️ Votación Iniciada',
      content: generateVotingStartPost(contest),
      scheduledFor: 'Al iniciar votación',
      type: 'voting_start',
      hashtags: generateHashtags(['votacion', 'historias', 'comunidad'])
    });

    // Post 7: Animar a leer historias
    posts.push({
      id: 7,
      title: '📚 Lee las Historias',
      content: generateReadStoriesPost(contest),
      scheduledFor: 'Mitad de votación',
      type: 'read_stories',
      hashtags: generateHashtags(['lectura', 'historias', 'vota'])
    });

    // Post 8: Resultados
    posts.push({
      id: 8,
      title: '🏆 Resultados',
      content: generateResultsPost(contest),
      scheduledFor: 'Al publicar resultados',
      type: 'results',
      hashtags: generateHashtags(['resultados', 'ganadores', 'celebracion'])
    });

    return posts;
  };

  // Generar post de nuevo concurso
  const generateNewContestPost = (contest) => {
    return `¡NUEVO RETO DE ESCRITURA! 🎯

"${contest.title}"

${contest.description}

📝 ${contest.min_words} - ${contest.max_words} palabras
📅 Envío hasta: ${new Date(contest.submission_deadline).toLocaleDateString('es-ES')}

¿Estás listo/a para el desafío? ¡Demuestra tu creatividad y únete a nuestra comunidad de escritores!

✍️ Participa en letranido.com`;
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

    return `✍️ TIP DE ESCRITURA PARA EL RETO

${randomTip}

¿Cuál es tu técnica favorita para superar el bloqueo creativo?

Comparte tu sabiduría con la comunidad 👇

#Reto: "${contest.title}"
📝 Participa en letranido.com`;
  };

  // Generar post motivacional
  const generateMotivationPost = (contest) => {
    return `🔥 ESCRITOR/A, ¡ESTE ES TU MOMENTO!

¿Ya empezaste tu historia para "${contest.title}"?

Recuerda:
✨ No existe la historia perfecta, solo la historia terminada
🎯 Cada palabra cuenta
💫 Tu perspectiva es única e irreemplazable

La comunidad está esperando tu voz. ¡No dejes que el mundo se pierda tu historia!

⏰ Aún hay tiempo
📝 letranido.com`;
  };

  // Generar post de recordatorio
  const generateReminderPost = (contest) => {
    return `⏰ ¡ÚLTIMOS DÍAS!

Solo quedan 5 días para enviar tu historia al reto:
"${contest.title}"

📅 Deadline: ${new Date(contest.submission_deadline).toLocaleDateString('es-ES')}

¿Tienes tu historia lista? ¿Necesitas esos últimos toques?

¡No dejes para mañana lo que puedes escribir hoy!

🏃‍♀️ El tiempo vuela, pero las buenas historias perduran
✍️ letranido.com`;
  };

  // Generar post de última llamada
  const generateLastCallPost = (contest) => {
    return `🚨 ¡ÚLTIMA LLAMADA!

⏰ Quedan menos de 24 horas para enviar tu historia

"${contest.title}"

Si tienes una historia a medias, ¡termínala!
Si solo tienes una idea, ¡plasmala!
Si aún no empiezas, ¡AHORA ES EL MOMENTO!

🔥 Las mejores historias a veces nacen de la presión del último momento

⚡ ACTÚA AHORA: letranido.com`;
  };

  // Generar post de inicio de votación
  const generateVotingStartPost = (contest) => {
    return `🗳️ ¡LA VOTACIÓN HA COMENZADO!

Las historias del reto "${contest.title}" están listas para ser leídas y votadas.

Nuestra increíble comunidad ha creado historias únicas que merecen ser descubiertas.

📚 Lee las historias
❤️ Vota por tus favoritas
💬 Deja comentarios constructivos
✨ Celebra la creatividad de la comunidad

Tu voto cuenta. Cada historia merece una oportunidad.

🔗 letranido.com`;
  };

  // Generar post para animar a leer
  const generateReadStoriesPost = (contest) => {
    return `📚 ¿YA LEÍSTE LAS HISTORIAS?

El reto "${contest.title}" tiene historias increíbles esperándote:

🌟 Diferentes perspectivas del mismo prompt
🎭 Estilos únicos de cada escritor
💫 Sorpresas en cada párrafo
🎯 Creatividad sin límites

Cada historia es un mundo nuevo. ¿Cuál será tu favorita?

👀 Lee ahora: letranido.com
❤️ No olvides votar`;
  };

  // Generar post de resultados
  const generateResultsPost = (contest) => {
    return `🏆 ¡RESULTADOS DEL RETO DISPONIBLES!

El reto "${contest.title}" ha concluido y ya puedes ver las historias más destacadas por la comunidad.

✨ Historias más votadas
📚 Creatividad extraordinaria
🎭 Diversidad de enfoques
💫 Talento de nuestra comunidad

¡Felicidades a todos los participantes! Cada historia aportó algo especial y único.

🎉 Ver resultados completos: letranido.com
✍️ ¿Listo para el próximo reto?`;
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
    link.download = `${post.type}-letranido.png`;
    link.href = imageData;
    link.click();
  };

  // Toggle mostrar/ocultar imagen
  const toggleImagePreview = (postId) => {
    setShowImageFor(showImageFor === postId ? null : postId);
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
          
          {generatedPosts.map((post, index) => (
            <div key={post.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{post.title}</h4>
                  <p className="text-sm text-gray-600">{post.scheduledFor}</p>
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
          <li>2. Haz clic en "Generar Posts del Mes"</li>
          <li>3. Copia cada post con el botón "Copiar"</li>
          <li>4. Haz clic en "Imagen" para generar la imagen del post</li>
          <li>5. Descarga la imagen con "Descargar"</li>
          <li>6. Sube imagen + texto a Buffer/Hootsuite</li>
          <li>7. Programa las fechas sugeridas</li>
          <li>8. ¡Relájate y deja que tu contenido trabaje por ti!</li>
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