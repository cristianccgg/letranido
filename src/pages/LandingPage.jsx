import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Clock,
  Trophy,
  Users,
  ArrowRight,
  Star,
  Calendar,
} from "lucide-react";
import ContestRulesModal from "../components/forms/ContestRulesModal";

const LandingPage = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Mock data - concurso mensual
  const currentContest = {
    id: 1,
    title: "El último libro de la biblioteca",
    description:
      "Eres el bibliotecario de una biblioteca que está a punto de cerrar para siempre. Solo queda un libro en los estantes. ¿Cuál es y por qué es tan especial?",
    endDate: new Date("2025-07-26T23:59:59"), // Fin del mes
    participants: 127,
    category: "Ficción",
    month: "Julio 2025",
    prize: "Insignia de Oro + Destacado del mes",
  };

  // Countdown timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = currentContest.endDate.getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []); // Dependencias vacías - solo se ejecuta una vez

  const featuredTexts = [
    {
      id: 1,
      title: "El Susurro de las Páginas",
      author: "Elena M.",
      excerpt:
        "Entre las sombras de los estantes vacíos, el último libro parecía brillar con luz propia. Sus páginas amarillentas guardaban...",
      likes: 45,
      category: "Ficción",
    },
    {
      id: 2,
      title: "Memorias de Papel",
      author: "Carlos R.",
      excerpt:
        "No era solo un libro, era una ventana al alma de todos los que habían pasado por esta biblioteca. Cada página contenía...",
      likes: 38,
      category: "Drama",
    },
    {
      id: 3,
      title: "La Guardiana de Historias",
      author: "Ana L.",
      excerpt:
        "Había dedicado cincuenta años de su vida a cuidar estos libros, y ahora solo uno quedaba. Pero sabía que era el más importante...",
      likes: 52,
      category: "Ficción",
    },
  ];

  const stats = {
    writers: 1234,
    texts: 5678,
    contests: 89,
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-20 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Libera tu
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                {" "}
                creatividad
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Únete a una comunidad de escritores apasionados. Recibe prompts
              mensuales, comparte tus historias y descubre nuevos talentos
              literarios.
            </p>

            {/* Current Contest Card */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">
                {/* Contest badge */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-bl-lg font-bold text-sm">
                  🏆 CONCURSO MENSUAL
                </div>

                <div className="flex items-center justify-between mb-4 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      {currentContest.month}
                    </span>
                    <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
                      {currentContest.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Premio</div>
                    <div className="text-sm font-medium text-yellow-600">
                      {currentContest.prize}
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentContest.title}
                </h2>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {currentContest.description}
                </p>

                {/* Countdown Timer */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-semibold text-red-800">
                      ¡El concurso cierra en:
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-2xl font-bold text-red-600">
                        {timeLeft.days}
                      </div>
                      <div className="text-xs text-gray-600">Días</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-2xl font-bold text-red-600">
                        {timeLeft.hours}
                      </div>
                      <div className="text-xs text-gray-600">Horas</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-2xl font-bold text-red-600">
                        {timeLeft.minutes}
                      </div>
                      <div className="text-xs text-gray-600">Min</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-2xl font-bold text-red-600">
                        {timeLeft.seconds}
                      </div>
                      <div className="text-xs text-gray-600">Seg</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {currentContest.participants} participantes
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Hasta {currentContest.endDate.toLocaleDateString("es-ES")}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to={`/write/${currentContest.id}`}
                    className="btn-primary flex items-center justify-center text-lg py-3 animate-pulse"
                  >
                    <PenTool className="h-5 w-5 mr-2" />
                    Participar en el concurso
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>

                  <Link
                    to={`/contest/current`}
                    className="btn-secondary flex items-center justify-center text-lg py-3 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Ver participaciones
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.writers.toLocaleString()}
                </div>
                <div className="text-gray-600">Escritores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.texts.toLocaleString()}
                </div>
                <div className="text-gray-600">Historias</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.contests}
                </div>
                <div className="text-gray-600">Concursos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline del concurso */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona el concurso?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nuestro sistema de fases garantiza que todos los participantes
              tengan las mismas oportunidades de ganar, sin importar cuándo
              envíen su historia.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Línea de tiempo */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200"></div>

              <div className="space-y-12">
                {/* Fase 1: Envío */}
                <div className="relative flex items-center">
                  <div className="flex-1 pr-8 text-right">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <h3 className="text-xl font-bold text-blue-900">
                          Fase de Envío
                        </h3>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            1
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-800 font-medium mb-2">
                        📅 Día 1 al 26 del mes
                      </div>
                      <p className="text-blue-700 text-sm mb-3">
                        Los escritores envían sus historias basadas en el prompt
                        del mes. Las participaciones permanecen{" "}
                        <strong>ocultas</strong> durante esta fase.
                      </p>
                      <div className="flex items-center justify-end gap-2 text-sm text-blue-600">
                        <span>📝 Solo escritura</span>
                        <span>•</span>
                        <span>🔒 Historias privadas</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white z-10"></div>

                  <div className="flex-1 pl-8"></div>
                </div>

                {/* Fase 2: Votación */}
                <div className="relative flex items-center">
                  <div className="flex-1 pr-8"></div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white z-10"></div>

                  <div className="flex-1 pl-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            2
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-green-900">
                          Fase de Votación
                        </h3>
                      </div>
                      <div className="text-green-800 font-medium mb-2">
                        📅 Día 27 al 31 del mes
                      </div>
                      <p className="text-green-700 text-sm mb-3">
                        ¡Las historias se revelan! Todos pueden leer y votar por
                        sus favoritas. Los escritores también pueden enviar
                        historias de último minuto.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <span>👀 Historias públicas</span>
                        <span>•</span>
                        <span>❤️ Votación activa</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fase 3: Resultados */}
                <div className="relative flex items-center">
                  <div className="flex-1 pr-8 text-right">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <h3 className="text-xl font-bold text-yellow-900">
                          Resultados
                        </h3>
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            3
                          </span>
                        </div>
                      </div>
                      <div className="text-yellow-800 font-medium mb-2">
                        📅 Día 1 del mes siguiente
                      </div>
                      <p className="text-yellow-700 text-sm mb-3">
                        Se anuncian los ganadores automáticamente. Los tres
                        primeros lugares reciben insignias especiales y
                        reconocimiento.
                      </p>
                      <div className="flex items-center justify-end gap-2 text-sm text-yellow-600">
                        <span>🏆 Ganadores</span>
                        <span>•</span>
                        <span>🎖️ Insignias</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full border-4 border-white z-10"></div>

                  <div className="flex-1 pl-8"></div>
                </div>
              </div>
            </div>

            {/* Estado actual */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-100 to-accent-100 border border-primary-200 rounded-lg px-6 py-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-800">
                  Actualmente en: <strong>Fase de Votación</strong> • Cierra en{" "}
                  {Math.floor(
                    (currentContest.endDate - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  días
                </span>
              </div>
            </div>

            {/* FAQ sobre el sistema */}
            <div className="mt-12 bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">
                ¿Por qué este sistema?
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs">⚖️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      Competencia justa
                    </h4>
                    <p className="text-gray-600">
                      Todos tienen la misma oportunidad de recibir votos, sin
                      ventaja por tiempo de envío.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      Más participación
                    </h4>
                    <p className="text-gray-600">
                      La fase de votación concentra la atención y aumenta las
                      lecturas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 text-xs">⏰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      Sin presión de tiempo
                    </h4>
                    <p className="text-gray-600">
                      Puedes enviar tu historia en cualquier momento del mes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-xs">📈</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      Mejor calidad
                    </h4>
                    <p className="text-gray-600">
                      Los escritores se enfocan en la calidad, no en ser los
                      primeros.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ganadores del mes anterior
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubre las historias ganadoras de <strong>Junio 2025</strong> y
              encuentra inspiración para tu próxima creación
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredTexts.map((text, index) => (
              <div
                key={text.id}
                className="card hover:shadow-md transition-shadow relative cursor-pointer p-4 rounded-2xl shadow-accent-500 bg-white border border-gray-200"
              >
                {/* Winner badges */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full p-2 shadow-lg">
                    <Trophy className="h-4 w-4" />
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-full p-2 shadow-lg">
                    <Star className="h-4 w-4" />
                  </div>
                )}
                {index === 2 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full p-2 shadow-lg">
                    <Star className="h-4 w-4" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {text.category}
                    </span>
                    {index === 0 && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                        🥇 GANADOR
                      </span>
                    )}
                    {index === 1 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                        🥈 2º LUGAR
                      </span>
                    )}
                    {index === 2 && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                        🥉 3º LUGAR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    {text.likes}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {text.title}
                </h3>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {text.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    por <span className="font-medium">{text.author}</span>
                  </span>
                  <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                    Leer completa →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/gallery"
              className="btn-secondary inline-flex items-center"
            >
              Ver historial de ganadores
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para ganar el concurso de {currentContest.month}?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Únete a {currentContest.participants} escritores que ya están
            compitiendo por la gloria literaria
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/write/${currentContest.id}`}
              className="bg-white text-primary-600 hover:bg-gray-50 font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <PenTool className="h-5 w-5 mr-2" />
              Participar ahora
            </Link>
            <button
              onClick={() => setShowRulesModal(true)}
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Ver las reglas
            </button>
          </div>
        </div>
      </section>

      {/* Contest Rules Modal */}
      <ContestRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        contest={currentContest}
      />
    </div>
  );
};

export default LandingPage;
