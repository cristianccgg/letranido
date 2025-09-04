import React from "react";
import { Link } from "react-router-dom";
import { Heart, Coffee, Shield, Code, Server, Users, Zap } from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const Support = () => {
  return (
    <>
      <SEOHead
        title="Apoya Letranido | Mantén la plataforma gratuita"
        description="Tu donación mantiene Letranido gratuito para toda la comunidad de escritores. Conoce cómo tu apoyo hace la diferencia."
        keywords="donación, apoyo, Letranido, gratuito, escritores, comunidad"
        canonicalUrl="https://letranido.com/apoyar"
      />

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Apoya a Letranido
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tu donación mantiene Letranido gratuito para toda nuestra comunidad de escritores
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-8 md:p-12">
              {/* Mission Statement */}
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Nuestro Compromiso
                </h2>
                <div className="bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-lg p-6 mb-6">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Letranido es y será gratuito.</strong> Todas las funciones actuales siempre lo seguirán siendo. 
                    Estamos desarrollando herramientas premium adicionales para quienes quieran más, pero nunca quitaremos lo que ya tienes.
                  </p>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Tu donación nos ayuda a mantener esta promesa y seguir creciendo como comunidad.
                </p>
              </div>

              {/* What Your Support Helps */}
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  ¿En qué ayuda tu donación?
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <Server className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Servidores y Hosting</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Mantener la plataforma rápida y disponible 24/7
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <Code className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Desarrollo</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Nuevas funciones y mejoras constantes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <Shield className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Seguridad</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Proteger tus datos y mantener la plataforma segura
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <Users className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Comunidad</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Concursos, eventos y actividades para escritores
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 text-white">
                <Coffee className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">
                  ¿Te gusta lo que hacemos?
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  Invítanos un café y ayúdanos a mantener Letranido funcionando para todos
                </p>
                <a
                  href="https://ko-fi.com/letranido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Coffee className="w-5 h-5" />
                  Apoyar en Ko-fi
                </a>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-primary-600 mb-2">91</div>
              <div className="text-gray-600 dark:text-gray-300">Escritores registrados</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-accent-600 mb-2">100%</div>
              <div className="text-gray-600 dark:text-gray-300">Gratuito siempre</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-secondary-600 mb-2">0</div>
              <div className="text-gray-600 dark:text-gray-300">Anuncios molestos</div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Preguntas Frecuentes
            </h3>
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Letranido seguirá siendo gratuito?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sí, absolutamente. Todas las funciones actuales siempre serán gratuitas. 
                  Solo estamos añadiendo herramientas premium opcionales para escritores que quieran más funcionalidades.
                </p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Las donaciones son obligatorias?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  No, para nada. Letranido funciona perfectamente sin donar. 
                  Las donaciones son completamente voluntarias y nos ayudan a mantener y mejorar la plataforma.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Qué beneficios premium habrá en el futuro?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Estamos desarrollando herramientas adicionales como estadísticas avanzadas, 
                  portfolio personal y más límites para escritores muy activos. 
                  Pero todo lo actual seguirá siendo gratuito.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Support;