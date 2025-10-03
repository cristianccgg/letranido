// components/admin/SocialGenerator.jsx - Generador automático de posts para redes sociales
import { useState } from 'react';
import { Share2, Copy, CheckCircle, Calendar, Instagram, Twitter, Facebook, Sparkles } from 'lucide-react';
import { useGlobalApp } from '../../contexts/GlobalAppContext';

const SocialGenerator = () => {
  const { currentContest, nextContest } = useGlobalApp();
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Plataformas disponibles
  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, maxChars: 2200, hashtags: true },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, maxChars: 280, hashtags: true },
    { id: 'facebook', name: 'Facebook', icon: Facebook, maxChars: 63206, hashtags: false },
    { id: 'linkedin', name: 'LinkedIn', icon: Share2, maxChars: 3000, hashtags: true }
  ];

  // Generar posts del mes completo
  const generateMonthlyPosts = async () => {
    setLoading(true);
    try {
      const contest = currentContest || nextContest;
      if (!contest) {
        alert('No hay reto disponible para generar posts');
        return;
      }

      const posts = await generateContestPosts(contest, selectedPlatform);
      setGeneratedPosts(posts);
    } catch (error) {
      console.error('Error generando posts:', error);
      alert('Error generando posts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función principal para generar posts basados en las fases del reto
  const generateContestPosts = async (contest, platform) => {
    const platformConfig = platforms.find(p => p.id === platform);
    const posts = [];
    
    // Post 1: Anuncio del nuevo reto
    posts.push({
      id: 1,
      title: '🎯 Anuncio del Nuevo Reto',
      content: generateNewContestPost(contest, platformConfig),
      scheduledFor: 'Día 1 del mes',
      type: 'new_contest',
      hashtags: generateHashtags(platform, ['reto', 'escritura', 'concurso'])
    });

    // Post 2: Tips de escritura
    posts.push({
      id: 2,
      title: '✍️ Tips de Escritura',
      content: generateWritingTipsPost(contest, platformConfig),
      scheduledFor: 'Día 5 del mes',
      type: 'tips',
      hashtags: generateHashtags(platform, ['tips', 'escritura', 'creatividad'])
    });

    // Post 3: Motivación a mitad de mes
    posts.push({
      id: 3,
      title: '🔥 Motivación de Mitad de Mes',
      content: generateMotivationPost(contest, platformConfig),
      scheduledFor: 'Día 10 del mes',
      type: 'motivation',
      hashtags: generateHashtags(platform, ['motivacion', 'escritura', 'creatividad'])
    });

    // Post 4: Recordatorio de envío
    posts.push({
      id: 4,
      title: '⏰ Recordatorio de Envío',
      content: generateReminderPost(contest, platformConfig),
      scheduledFor: '5 días antes del cierre',
      type: 'reminder',
      hashtags: generateHashtags(platform, ['ultimosdias', 'envio', 'deadline'])
    });

    // Post 5: Última llamada
    posts.push({
      id: 5,
      title: '🚨 Última Llamada',
      content: generateLastCallPost(contest, platformConfig),
      scheduledFor: '24 horas antes del cierre',
      type: 'last_call',
      hashtags: generateHashtags(platform, ['ultimahora', 'deadline', 'urgente'])
    });

    // Post 6: Votación iniciada
    posts.push({
      id: 6,
      title: '🗳️ Votación Iniciada',
      content: generateVotingStartPost(contest, platformConfig),
      scheduledFor: 'Al iniciar votación',
      type: 'voting_start',
      hashtags: generateHashtags(platform, ['votacion', 'historias', 'comunidad'])
    });

    // Post 7: Animar a leer historias
    posts.push({
      id: 7,
      title: '📚 Lee las Historias',
      content: generateReadStoriesPost(contest, platformConfig),
      scheduledFor: 'Mitad de votación',
      type: 'read_stories',
      hashtags: generateHashtags(platform, ['lectura', 'historias', 'vota'])
    });

    // Post 8: Resultados
    posts.push({
      id: 8,
      title: '🏆 Resultados',
      content: generateResultsPost(contest, platformConfig),
      scheduledFor: 'Al publicar resultados',
      type: 'results',
      hashtags: generateHashtags(platform, ['resultados', 'ganadores', 'celebracion'])
    });

    return posts;
  };

  // Generar post de nuevo concurso
  const generateNewContestPost = (contest, platform) => {
    const baseText = `🎯 ¡NUEVO RETO DE ESCRITURA!

"${contest.title}"

${contest.description}

📝 ${contest.min_words} - ${contest.max_words} palabras
📅 Envío hasta: ${new Date(contest.submission_deadline).toLocaleDateString('es-ES')}
🏆 ¡Premios y reconocimiento para los ganadores!

¿Estás listo/a para el desafío? ¡Tu historia puede ser la próxima ganadora!

✍️ Participa en letranido.com`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post de tips
  const generateWritingTipsPost = (contest, platform) => {
    const tips = [
      '🎯 Lee el prompt varias veces y busca diferentes interpretaciones',
      '💡 Empieza con una imagen o emoción, no con la trama',
      '⏱️ Escribe el primer borrador sin parar, edita después',
      '🎭 Dale voz única a tu narrador',
      '✨ El final debe resonar con el inicio'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    const baseText = `✍️ TIP DE ESCRITURA PARA EL RETO

${randomTip}

¿Cuál es tu técnica favorita para superar el bloqueo creativo?

Comparte tu sabiduría con la comunidad 👇

#Reto: "${contest.title}"
📝 Participa en letranido.com`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post motivacional
  const generateMotivationPost = (contest, platform) => {
    const baseText = `🔥 ESCRITOR/A, ¡ESTE ES TU MOMENTO!

¿Ya empezaste tu historia para "${contest.title}"?

Recuerda: 
✨ No existe la historia perfecta, solo la historia terminada
🎯 Cada palabra cuenta
💫 Tu perspectiva es única e irreemplazable

La comunidad está esperando tu voz. ¡No dejes que el mundo se pierda tu historia!

⏰ Aún hay tiempo
📝 letranido.com`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post de recordatorio
  const generateReminderPost = (contest, platform) => {
    const baseText = `⏰ ¡ÚLTIMOS DÍAS!

Solo quedan 5 días para enviar tu historia al reto:
"${contest.title}"

📅 Deadline: ${new Date(contest.submission_deadline).toLocaleDateString('es-ES')}

¿Tienes tu historia lista? ¿Necesitas esos últimos toques?

¡No dejes para mañana lo que puedes escribir hoy! 

🏃‍♀️ El tiempo vuela, pero las buenas historias perduran
✍️ letranido.com`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post de última llamada
  const generateLastCallPost = (contest, platform) => {
    const baseText = `🚨 ¡ÚLTIMA LLAMADA! 

⏰ Quedan menos de 24 horas para enviar tu historia

"${contest.title}"

Si tienes una historia a medias, ¡termínala!
Si solo tienes una idea, ¡plasmala!
Si aún no empiezas, ¡AHORA ES EL MOMENTO!

🔥 Las mejores historias a veces nacen de la presión del último momento

⚡ ACTÚA AHORA: letranido.com`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post de inicio de votación
  const generateVotingStartPost = (contest, platform) => {
    const baseText = `🗳️ ¡LA VOTACIÓN HA COMENZADO!

Las historias del reto "${contest.title}" están listas para ser leídas y votadas.

Nuestra increíble comunidad ha creado historias únicas que merecen ser descubiertas.

📚 Lee las historias
❤️ Vota por tus favoritas  
💬 Deja comentarios constructivos
🏆 Ayuda a elegir a los ganadores

Tu voto cuenta. Cada historia merece una oportunidad.

🔗 letranido.com`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post para animar a leer
  const generateReadStoriesPost = (contest, platform) => {
    const baseText = `📚 ¿YA LEÍSTE LAS HISTORIAS?

El reto "${contest.title}" tiene historias increíbles esperándote:

🌟 Diferentes perspectivas del mismo prompt
🎭 Estilos únicos de cada escritor
💫 Sorpresas en cada párrafo
🎯 Creatividad sin límites

Cada historia es un mundo nuevo. ¿Cuál será tu favorita?

👀 Lee ahora: letranido.com
❤️ No olvides votar`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar post de resultados
  const generateResultsPost = (contest, platform) => {
    const baseText = `🏆 ¡RESULTADOS DEL RETO DISPONIBLES!

El reto "${contest.title}" ya tiene ganadores oficiales.

🥇 Primer lugar: [Será actualizado en el sitio]
🥈 Segundo lugar: [Será actualizado en el sitio]  
🥉 Tercer lugar: [Será actualizado en el sitio]

¡Felicidades a todos los participantes! Cada historia aportó algo especial a nuestra comunidad.

🎉 Ver resultados completos: letranido.com
✍️ ¿Listo para el próximo reto?`;

    return truncateForPlatform(baseText, platform);
  };

  // Generar hashtags según la plataforma
  const generateHashtags = (platform, keywords) => {
    if (!platforms.find(p => p.id === platform)?.hashtags) return '';

    const baseHashtags = ['#letranido', '#escritura', '#retos', '#comunidad'];
    const keywordHashtags = keywords.map(k => `#${k}`);
    
    const allHashtags = [...baseHashtags, ...keywordHashtags];
    
    // Limitar hashtags según plataforma
    const maxHashtags = platform === 'instagram' ? 10 : 5;
    return allHashtags.slice(0, maxHashtags).join(' ');
  };

  // Truncar texto según límites de la plataforma
  const truncateForPlatform = (text, platform) => {
    const maxChars = platform.maxChars;
    if (text.length <= maxChars) return text;
    
    return text.substring(0, maxChars - 3) + '...';
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

      {/* Selector de Plataforma */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Selecciona la plataforma:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlatform === platform.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm font-medium">{platform.name}</p>
                <p className="text-xs text-gray-500">{platform.maxChars} chars</p>
              </button>
            );
          })}
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
              <Sparkles className="w-5 h-5" />
              Generar Posts del Mes
            </div>
          )}
        </button>
      </div>

      {/* Posts Generados */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Posts Generados ({generatedPosts.length})
          </h3>
          
          {generatedPosts.map((post, index) => (
            <div key={post.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{post.title}</h4>
                  <p className="text-sm text-gray-600">{post.scheduledFor}</p>
                </div>
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
            </div>
          ))}
        </div>
      )}

      {/* Ayuda */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Cómo usar:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Selecciona tu plataforma preferida</li>
          <li>2. Haz clic en "Generar Posts del Mes"</li>
          <li>3. Copia cada post y pégalo en Buffer/Hootsuite</li>
          <li>4. Programa las fechas sugeridas</li>
          <li>5. ¡Relájate y deja que tu contenido trabaje por ti!</li>
        </ul>
      </div>
    </div>
  );
};

export default SocialGenerator;