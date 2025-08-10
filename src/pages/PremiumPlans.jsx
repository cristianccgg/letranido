import { useState } from 'react';
import { Check, Crown, MessageSquare, Zap, Star, Users } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import { FEATURES } from '../lib/config';

const PremiumPlans = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handlePlanClick = (planType) => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  return (
    <>
      <SEOHead 
        title="Planes Premium - Letranido"
        description="Descubre nuestros planes premium y lleva tu escritura al siguiente nivel con funciones avanzadas y feedback profesional."
        keywords="planes premium, escritura profesional, feedback personalizado, letranido premium"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-950 py-12">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Lleva tu Escritura al
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Siguiente Nivel</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Desbloquea todo tu potencial como escritor con nuestros planes diseñados para impulsar tu creatividad
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            
            {/* Plan Básico */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 relative">
              <div className="text-center mb-6">
                <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Básico</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  Gratis
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Para comenzar tu viaje</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">1 concurso por mes</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Máximo 1,000 palabras</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Participación en votaciones</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Perfil público básico</span>
                </li>
              </ul>
              
              <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-3 rounded-lg font-medium cursor-default">
                Plan Actual
              </button>
            </div>

            {/* Plan Premium - Destacado */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 relative transform scale-105">
              <div className="absolute top-4 right-4">
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </div>
              </div>
              
              <div className="text-center mb-6">
                <Crown className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Escritor Pro</h3>
                <div className="text-4xl font-bold text-white">
                  $2.99
                  <span className="text-xl text-blue-200">/mes</span>
                </div>
                <p className="text-blue-200 mt-2">Para escritores dedicados</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Concursos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Hasta 3,000 palabras</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Portafolio personal</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Estadísticas avanzadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Bio personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Ubicación y website</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Badge "Escritor Pro"</span>
                </li>
              </ul>
              
              <button 
                onClick={() => handlePlanClick('premium')}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                Próximamente
              </button>
            </div>

            {/* Feedback Profesional */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 relative">
              <div className="text-center mb-6">
                <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feedback Pro</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  $2.49
                  <span className="text-xl text-gray-500">/historia</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Cuando lo necesites</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Feedback profesional detallado</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Análisis de estructura</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Sugerencias de estilo</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Respuesta en 48h</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Pago por uso</span>
                </li>
              </ul>
              
              <button 
                onClick={() => handlePlanClick('feedback')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Próximamente
              </button>
            </div>
          </div>

          {/* Comparación */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              ¿Por qué elegir Escritor Pro?
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Zap className="w-6 h-6 text-yellow-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Sin Límites de Participación</h4>
                    <p className="text-gray-600 dark:text-gray-300">Participa en todos los concursos que quieras, cuando quieras</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Star className="w-6 h-6 text-yellow-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Historias Más Largas</h4>
                    <p className="text-gray-600 dark:text-gray-300">Expresa toda tu creatividad con hasta 3,000 palabras</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Crown className="w-6 h-6 text-purple-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Perfil Profesional</h4>
                    <p className="text-gray-600 dark:text-gray-300">Bio personalizada, ubicación y link a tu website personal</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MessageSquare className="w-6 h-6 text-blue-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Portafolio + Estadísticas</h4>
                    <p className="text-gray-600 dark:text-gray-300">Espacio privado para tus historias y análisis detallado de progreso</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Final */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              ¿Tienes preguntas? <a href="/faq" className="text-blue-600 hover:underline">Visita nuestro FAQ</a>
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              💡 Consejo: Solo por $0.50 más que el feedback individual, obtienes todas las funciones premium
            </div>
          </div>

          {/* Modal Coming Soon */}
          {showComingSoon && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Próximamente!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Estamos trabajando en estas increíbles funciones. Te notificaremos cuando estén listas.
                </p>
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PremiumPlans;