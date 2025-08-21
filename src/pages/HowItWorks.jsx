import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PenTool,
  Users,
  Trophy,
  Heart,
  CheckCircle,
  ArrowRight,
  Vote,
  Crown,
  Sparkles,
  BookOpen,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const HowItWorks = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-300">
      <SEOHead
        title="Cómo Funciona el Reto"
        description="Descubre paso a paso cómo participar en los retos de Letranido: fases, cronología, reglas y sistema de votación."
        keywords="cómo funciona, reto escritura, fases reto, letranido, guía participación"
        url="/como-funciona"
      />

      {/* Hero Section */}
      <section className="py-12 lg:py-20 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-16 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-15 blur-lg"></div>
          <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-pink-200 to-indigo-300 rounded-full opacity-12 blur-lg"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center relative">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full mb-6 shadow-xl">
              <BookOpen className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight">
              ¿Cómo Funciona el Reto?
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-dark-300 max-w-3xl mx-auto">
              Un proceso simple, transparente y emocionante para compartir tu creatividad con nuestra comunidad en cualquier formato de reto
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Overview */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
              Cronología de los Retos
            </h2>
            <p className="text-lg text-gray-600 dark:text-dark-300 max-w-2xl mx-auto">
              Cada reto sigue una estructura clara que garantiza tiempo suficiente para crear, leer y votar
            </p>
          </div>

          {/* Timeline Visual */}
          <div className="relative">
            {/* Línea central */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300"></div>

            {/* Fases del Timeline */}
            <div className="space-y-12">
              {/* Fase 1: Envío */}
              <div className="relative flex items-center">
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-4 border-white dark:border-dark-800 shadow-lg z-10 flex items-center justify-center">
                  <PenTool className="h-4 w-4 text-white" />
                </div>
                <div className="ml-16 md:ml-0 md:w-1/2 md:pr-8">
                  <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-lg flex items-center justify-center">
                        <PenTool className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100">Fase de Envío</h3>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Mayoría del período del reto</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-dark-300 mb-4">
                      Los escritores tienen la mayor parte del tiempo del reto para crear y enviar sus historias basadas en el prompt. El envío cierra 3-4 días antes del final del reto.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Puedes editar tu historia las veces que quieras</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Límite de palabras especificado en cada prompt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fase 2: Votación */}
              <div className="relative flex items-center md:flex-row-reverse">
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full border-4 border-white dark:border-dark-800 shadow-lg z-10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div className="ml-16 md:ml-0 md:w-1/2 md:pl-8">
                  <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-lg flex items-center justify-center">
                        <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100">Fase de Votación</h3>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Últimos 3-4 días del reto</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-dark-300 mb-4">
                      La comunidad lee todas las historias enviadas y elige sus 3 favoritas durante los últimos días del reto. También pueden dejar comentarios constructivos.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>3 votos máximo por usuario</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>No puedes votar por tu propia historia</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fase 3: Resultados */}
              <div className="relative flex items-center">
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 bg-gradient-to-br from-pink-500 to-yellow-600 rounded-full border-4 border-white dark:border-dark-800 shadow-lg z-10 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="ml-16 md:ml-0 md:w-1/2 md:pr-8">
                  <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-pink-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-yellow-200 dark:from-pink-800 dark:to-yellow-700 rounded-lg flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100">Resultados</h3>
                        <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Al finalizar el reto</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-dark-300 mb-4">
                      Los resultados se anuncian automáticamente al cerrar la votación. Los ganadores reciben badges especiales de inmediato.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Top 3 historias más votadas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Badges automáticos para ganadores</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contest Types Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-indigo-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
              Tipos de Retos
            </h2>
            <p className="text-lg text-gray-600 dark:text-dark-300 max-w-2xl mx-auto">
              Ofrecemos diferentes formatos de retos para adaptarnos a tu ritmo de escritura
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Retos Mensuales */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 text-center">
                Retos Mensuales
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Duración: ~30 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Envíos: 24-26 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Votación: 4-6 días</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-dark-300 text-sm text-center">
                Perfecto para desarrollar historias más elaboradas con tiempo suficiente para la revisión.
              </p>
            </div>

            {/* Retos Quincenales */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 text-center">
                Retos Quincenales
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Duración: ~15 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Envíos: 11-12 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Votación: 3-4 días</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-dark-300 text-sm text-center">
                Ritmo dinámico para mantener la creatividad activa con desafíos más frecuentes.
              </p>
              <div className="mt-4 text-center">
                <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  Próximamente
                </span>
              </div>
            </div>

            {/* Retos Semanales */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-pink-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-orange-200 dark:from-pink-800 dark:to-orange-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 text-center">
                Retos Semanales
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Duración: 7 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Envíos: 4-5 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-dark-300">Votación: 2-3 días</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-dark-300 text-sm text-center">
                Desafíos rápidos e intensos para desarrollar agilidad creativa y escritura espontánea.
              </p>
              <div className="mt-4 text-center">
                <span className="inline-block px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium">
                  Próximamente
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-dark-600">
              <p className="text-gray-700 dark:text-dark-300 mb-4">
                <strong>Actualmente disponibles:</strong> Retos Mensuales
              </p>
              <p className="text-sm text-gray-600 dark:text-dark-400">
                Estamos trabajando en nuevos formatos para ofrecerte más opciones de participación. 
                ¡Mantente atento a las novedades!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Process */}
      <section className="py-16 lg:py-20 bg-white/50 dark:bg-dark-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
              Proceso Detallado
            </h2>
            <p className="text-lg text-gray-600 dark:text-dark-300">
              Conoce cada paso del proceso para participar exitosamente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1: Registro */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-3">1. Regístrate</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-4">
                Crea tu cuenta gratuita en Letranido para poder participar en los retos.
              </p>
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                ✨ ¡Es completamente gratis!
              </div>
            </div>

            {/* Step 2: Lee el Prompt */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-800 dark:to-pink-700 rounded-xl flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-3">2. Lee el Prompt</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-4">
                Cada mes publicamos un prompt único. Puedes interpretarlo literalmente o usarlo como inspiración.
              </p>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                💡 Libertad creativa total
              </div>
            </div>

            {/* Step 3: Escribe */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-pink-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-indigo-200 dark:from-pink-800 dark:to-indigo-700 rounded-xl flex items-center justify-center mb-4">
                <PenTool className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-3">3. Escribe tu Historia</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-4">
                Crea tu historia respetando el límite de palabras. Tienes la mayor parte del tiempo del reto para escribir y perfeccionar.
              </p>
              <div className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                ⏰ Hasta 3-4 días antes del cierre
              </div>
            </div>

            {/* Step 4: Envía */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-green-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-200 dark:from-green-800 dark:to-blue-700 rounded-xl flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-3">4. Envía tu Historia</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-4">
                Publica tu historia en la plataforma. Podrás editarla hasta que termine la fase de envío.
              </p>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✏️ Editable hasta el cierre de envíos
              </div>
            </div>

            {/* Step 5: Vota */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-blue-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-800 dark:to-indigo-700 rounded-xl flex items-center justify-center mb-4">
                <Vote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-3">5. Vota por tus Favoritas</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-4">
                Lee las historias de otros escritores y vota por tus 3 favoritas durante la fase de votación.
              </p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                🗳️ 3 votos máximo
              </div>
            </div>

            {/* Step 6: Resultados */}
            <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-yellow-100 dark:border-dark-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-200 dark:from-yellow-800 dark:to-orange-700 rounded-xl flex items-center justify-center mb-4">
                <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-3">6. Descubre Ganadores</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-4">
                Los resultados se anuncian automáticamente y los ganadores reciben badges especiales.
              </p>
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                🏆 Badges automáticos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voting System Details */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
              Sistema de Votación
            </h2>
            <p className="text-lg text-gray-600 dark:text-dark-300">
              Un sistema justo y democrático para elegir las mejores historias
            </p>
          </div>

          <div className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-indigo-100 dark:border-dark-700">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  Cómo Votar
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">1</span>
                    </div>
                    <p className="text-gray-600 dark:text-dark-300">Lee todas las historias del reto</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">2</span>
                    </div>
                    <p className="text-gray-600 dark:text-dark-300">Haz clic en el corazón de tus favoritas</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">3</span>
                    </div>
                    <p className="text-gray-600 dark:text-dark-300">Puedes cambiar tus votos cuando quieras</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Reglas de Votación
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-dark-300">Máximo 3 votos por usuario</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-red-500 text-lg flex-shrink-0">✗</span>
                    <span className="text-sm text-gray-700 dark:text-dark-300">No puedes votar por tu propia historia</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-dark-300">Los votos son anónimos durante la votación</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-20 bg-white/50 dark:bg-dark-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600 dark:text-dark-300">
              Resolvemos las dudas más comunes sobre el proceso
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "word-limit",
                question: "¿Cuál es el límite de palabras?",
                answer: "Cada reto especifica su propio límite de palabras, típicamente entre 100 y 1,000 palabras. El límite exacto se muestra en el prompt del mes."
              },
              {
                id: "edit-story",
                question: "¿Puedo editar mi historia después de enviarla?",
                answer: "Sí, puedes editar tu historia libremente durante toda la fase de envío. Una vez que comience la votación (últimos 3-4 días del reto), las historias quedan bloqueadas."
              },
              {
                id: "multiple-stories",
                question: "¿Puedo enviar múltiples historias?",
                answer: "Solo puedes enviar una historia por reto. Esto garantiza que todos los participantes tengan las mismas oportunidades."
              },
              {
                id: "late-submission",
                question: "¿Qué pasa si envío mi historia tarde?",
                answer: "Las historias enviadas después del cierre de la fase de envío no podrán participar en ese reto. Tendrás que esperar al siguiente reto para participar."
              },
              {
                id: "voting-criteria",
                question: "¿Qué criterios debo usar para votar?",
                answer: "No hay criterios específicos. Vota por las historias que más te gusten, ya sea por su creatividad, estilo, emoción o cualquier aspecto que te llame la atención."
              }
            ].map((faq) => (
              <div key={faq.id} className="bg-white/95 dark:bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-dark-700 overflow-hidden">
                <button
                  onClick={() => toggleSection(faq.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">{faq.question}</h3>
                    {expandedSection === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {expandedSection === faq.id && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-dark-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 lg:p-12 shadow-2xl border border-indigo-100 dark:border-dark-600">
            <div className="mb-8">
              <Sparkles className="h-16 w-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
                ¿Listo para Participar?
              </h2>
              <p className="text-xl text-gray-600 dark:text-dark-300 max-w-2xl mx-auto">
                Únete a nuestra comunidad de escritores y participa en nuestros retos. ¡Tu historia podría ser la próxima ganadora!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contest/current"
                className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg"
              >
                <PenTool className="h-6 w-6 mr-2" />
                Participar Ahora
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center px-8 py-4 rounded-xl bg-white dark:bg-dark-800 border-2 border-indigo-200 dark:border-dark-600 text-indigo-700 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-dark-700 hover:shadow-lg hover:scale-105 transition-all duration-300 text-lg"
              >
                <HelpCircle className="h-6 w-6 mr-2" />
                Más Preguntas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;