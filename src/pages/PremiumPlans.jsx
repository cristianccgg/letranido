import { useState } from 'react';
import { Check, Crown, MessageSquare, Zap, Star, Users, ArrowRight, Sparkles } from 'lucide-react';
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
          
          {/* Header con animaciones */}
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Sparkles className="w-64 h-64 text-blue-300 animate-pulse" />
            </div>
            
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>✨ Precios de lanzamiento disponibles</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Lleva tu Escritura al
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> Siguiente Nivel</span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Únete a una comunidad de <strong>escritores serios</strong> que están transformando su pasión en expertise. 
                <span className="text-blue-600 font-medium"> Comienza gratis, crece con premium.</span>
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Sin compromisos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Cancela cuando quieras</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Precios para LATAM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            
            {/* Plan Básico */}
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-300 cursor-pointer">
              {/* Efecto de hover background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Badge "Perfecto para empezar" */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  Perfecto para empezar
                </div>
              </div>
              
              <div className="relative text-center mb-6">
                <div className="relative inline-block">
                  <Users className="w-12 h-12 text-blue-500 mx-auto mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                  <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors duration-300">Básico</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                  Gratis
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2 group-hover:text-gray-700 transition-colors duration-300">Tu primer paso como escritor</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">1 reto por mes</span>
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
            <div className="group bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 relative transform scale-105 overflow-hidden transition-all duration-700 hover:scale-110 hover:shadow-3xl cursor-pointer">
              {/* Efectos de fondo animados */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Partículas flotantes */}
              <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-70"></div>
              <div className="absolute top-20 right-16 w-1 h-1 bg-pink-300 rounded-full animate-pulse opacity-60"></div>
              <div className="absolute bottom-16 left-20 w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce opacity-50"></div>
              
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                  ⭐ Más Popular
                </div>
              </div>
              
              {/* Ribbon lateral */}
              <div className="absolute -top-1 -left-1 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45 translate-x-[-50%] translate-y-[-50%] flex items-center justify-center">
                <Crown className="w-4 h-4 text-white transform -rotate-45" />
              </div>
              
              <div className="relative text-center mb-6 z-10">
                <div className="relative inline-block">
                  <Crown className="w-14 h-14 text-yellow-300 mx-auto mb-4 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 drop-shadow-2xl" />
                  <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">Escritor Pro</h3>
                <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-500">
                  $2.99
                  <span className="text-xl text-blue-200 font-normal">/mes</span>
                </div>
                <p className="text-blue-100 font-medium group-hover:text-white transition-colors duration-300">Para escritores serios</p>
                
                {/* Indicador de ahorro */}
                <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-medium">💰 Solo $0.50 más que feedback individual</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-300 mr-3" />
                  <span className="text-white font-medium">Retos ilimitados</span>
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
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-purple-300 cursor-pointer">
              {/* Efecto de hover background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Badge estratégico */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                  Pruébalo una vez
                </div>
              </div>
              
              <div className="relative text-center mb-6">
                <div className="relative inline-block">
                  <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                  <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 transition-colors duration-300">Feedback Pro</h3>
                <div className="relative">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                    $2.49
                    <span className="text-xl text-gray-500">/historia</span>
                  </div>
                  {/* Comparación sutil */}
                  <div className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    vs $2.99/mes ilimitado
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2 group-hover:text-gray-700 transition-colors duration-300">Solo cuando lo necesites</p>
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

          {/* Por qué elegir Pro - Actualizado */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-12 border border-blue-200 dark:border-blue-800">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                La Diferencia Escritor Pro
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Más que funciones premium, es tu <strong>evolución como escritor</strong>. 
                Por menos que un café al mes.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Creatividad Sin Límites</h4>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span>Retos ilimitados por mes</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span>Hasta 3,000 palabras por historia</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span>Portafolio personal permanente</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Presencia Profesional</h4>
                </div>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    <span>Bio personalizada que perdura</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    <span>Link a tu website personal</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    <span>Feedback profesional incluido</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-400">Política de Degradación Suave</h4>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    Si cancelas, <strong>conservas</strong> tu bio, portafolio y trabajo. Solo pierdes la capacidad de editar y agregar nuevo contenido.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Específico de Planes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Preguntas Frecuentes sobre Planes
            </h3>
            
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Qué pasa si cancelo mi plan Premium?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Tu trabajo se conserva.</strong> Mantienes tu bio, portafolio y todas las historias, pero no podrás editarlos ni agregar nuevo contenido. Puedes reactivar Premium cuando quieras y todo vuelve a estar disponible.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Vale la pena pagar por feedback individual vs ser Premium?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Si solo necesitas feedback ocasional, $2.49/historia está perfecto. Pero si quieres feedback más de una vez al mes, Premium te sale mejor: por solo $0.50 más obtienes feedback ilimitado + todas las funciones premium.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Puedo cambiar de plan cuando quiera?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutamente. Puedes upgrade a Premium en cualquier momento y downgrade al final de tu período de facturación. Sin penalizaciones ni compromisos a largo plazo.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¿El feedback profesional realmente vale la pena?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Nuestro profesional tiene años de experiencia en escritura y comunidad literaria. Recibes análisis detallado de estructura, estilo y narrativa en 48 horas. Es como tener un mentor personal.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Por qué estos precios tan accesibles?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Creemos que la escritura de calidad no debería ser un privilegio. Nuestros precios están pensados específicamente para el mercado latinoamericano, manteniendo calidad profesional a precios justos.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Final mejorado */}
          <div className="text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Tienes dudas? Estamos aquí para ayudarte
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Nuestro equipo responde en menos de 24 horas. 
                <a href="/faq" className="text-blue-600 hover:underline font-medium ml-1">Revisa nuestro FAQ</a> 
                o contáctanos directamente.
              </p>
              
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Respuesta rápida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Soporte en español</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Comunidad amigable</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                💡 Tip Pro: ¿Solo necesitas feedback ocasional?
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Empieza con feedback por $2.49. Si te gusta, 
                <strong className="text-blue-600"> por solo $0.50 más al mes obtienes TODO ilimitado</strong>
              </p>
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