import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Trophy,
  Shield,
  Clock,
  Users,
  Heart,
  PenTool,
  Mail,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const FAQ = () => {
  const [openItems, setOpenItems] = useState(new Set([0])); // Primer item abierto por defecto

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqSections = [
    {
      title: "Concursos y Participación",
      icon: Trophy,
      color: "indigo",
      items: [
        {
          question: "¿Cómo funciona el sistema de concursos?",
          answer: (
            <div className="space-y-3">
              <p>
                Cada mes lanzamos un nuevo concurso con un prompt único. El proceso tiene tres fases:
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                  <PenTool className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <strong className="text-indigo-700">Fase de Envío</strong>
                    <p className="text-sm text-gray-600">
                      Los escritores envían sus historias basadas en el prompt del mes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Heart className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <strong className="text-purple-700">Fase de Votación</strong>
                    <p className="text-sm text-gray-600">
                      La comunidad lee y vota por sus historias favoritas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                  <Trophy className="h-5 w-5 text-pink-600 mt-1" />
                  <div>
                    <strong className="text-pink-700">Resultados</strong>
                    <p className="text-sm text-gray-600">
                      Se anuncian los ganadores y se otorgan badges especiales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          question: "¿Puedo participar si soy principiante?",
          answer: (
            <div className="space-y-3">
              <p className="font-medium text-green-700">
                ¡Por supuesto! Letranido está diseñado para escritores de todos los niveles.
              </p>
              <p>
                No importa si nunca has escrito una historia antes o si eres un autor experimentado. 
                Nuestra comunidad es muy acogedora y siempre está dispuesta a ayudar y dar feedback constructivo.
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  💡 <strong>Tip:</strong> Tu primera historia te dará automáticamente el badge "Primera Pluma".
                </p>
              </div>
            </div>
          ),
        },
        {
          question: "¿Hay límite de palabras para las historias?",
          answer: (
            <div className="space-y-3">
              <p>
                Sí, cada concurso tiene un límite de palabras específico que depende de la temática y el tipo de concurso.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2">
                  <li><strong>Rango general:</strong> Mínimo 100 - Máximo 1,000 palabras</li>
                  <li><strong>Puede variar:</strong> Algunos concursos pueden tener límites diferentes</li>
                  <li><strong>Siempre especificado:</strong> El límite exacto se muestra en cada prompt</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Revisa siempre los detalles del concurso actual para conocer el límite específico de ese mes.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puedo editar mi historia después de enviarla?",
          answer: (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-700">Sí, durante la fase de envío</p>
                  <p className="text-sm text-green-600">
                    Puedes editar tu historia libremente mientras el concurso esté en fase de envío.
                  </p>
                </div>
              </div>
              <p>
                Una vez que termine la fase de envío y comience la votación, las historias quedan bloqueadas 
                para mantener la integridad del concurso.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Aprovecha todo el período de envío para perfeccionar tu historia antes del cierre.
                </p>
              </div>
            </div>
          ),
        },
        {
          question: "¿Qué pasa si no termino mi historia a tiempo?",
          answer: (
            <div className="space-y-3">
              <p>
                Si no logras enviar tu historia antes del cierre del concurso, tendrás que esperar al siguiente mes.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Consejo:</strong> ¡No dejes todo para el último momento! Tienes todo el mes para escribir y perfeccionar tu historia.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Recuerda que siempre puedes participar en el siguiente concurso mensual con un nuevo prompt.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      title: "Sistema de Badges y Reconocimientos",
      icon: CheckCircle,
      color: "purple",
      items: [
        {
          question: "¿Qué son los badges y cómo los consigo?",
          answer: (
            <div className="space-y-4">
              <p>
                Los badges son reconocimientos especiales que celebran tus logros como escritor en la comunidad.
              </p>
              <div className="grid gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <h4 className="font-semibold text-indigo-700 mb-2">🖋️ Badges de Escritura</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Primera Pluma:</strong> Envía tu primera historia</li>
                    <li>• <strong>Escritor Constante:</strong> Participa en 3 concursos</li>
                    <li>• <strong>Veterano:</strong> Participa en 10 concursos</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-700 mb-2">🏆 Badges de Victoria</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Ganador:</strong> Gana un concurso mensual</li>
                    <li>• <strong>Finalista:</strong> Queda en el top 3</li>
                    <li>• <strong>Veterano Ganador:</strong> Gana 3 concursos</li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
        {
          question: "¿Puedo perder un badge una vez que lo tengo?",
          answer: (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-700">Los badges son permanentes</p>
                  <p className="text-sm text-green-600">
                    Una vez que ganas un badge, es tuyo para siempre.
                  </p>
                </div>
              </div>
              <p>
                Los badges representan logros que ya has alcanzado, por lo que no se pueden quitar. 
                Tu colección solo puede crecer con el tiempo.
              </p>
            </div>
          ),
        },
        {
          question: "¿Los badges aparecen en mi perfil público?",
          answer: (
            <p>
              Sí, todos tus badges se muestran orgullosamente en tu perfil público. Otros usuarios pueden 
              ver tus logros cuando visitan tu perfil o cuando comentas en historias. Es una forma de 
              mostrar tu experiencia y trayectoria en la comunidad.
            </p>
          ),
        },
      ],
    },
    {
      title: "Derechos de Autor y Propiedad",
      icon: Shield,
      color: "pink",
      items: [
        {
          question: "¿Mantengo los derechos de mi historia?",
          answer: (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Shield className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <p className="font-bold text-green-700 text-lg">¡Absolutamente sí!</p>
                  <p className="text-green-600">
                    Mantienes todos los derechos de autor sobre tus historias. Son tuyas y siempre lo serán.
                  </p>
                </div>
              </div>
              <p>
                Letranido solo proporciona la plataforma para compartir tu trabajo. No tenemos ningún 
                derecho sobre tu contenido más allá del permiso básico para mostrarlo en el sitio web.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puede alguien más usar mi historia sin permiso?",
          answer: (
            <div className="space-y-3">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="font-medium text-red-700">
                  No, está estrictamente prohibido
                </p>
                <p className="text-sm text-red-600">
                  Nadie puede republicar, copiar o usar tu historia sin tu permiso expreso.
                </p>
              </div>
              <p>
                Si encuentras tu trabajo siendo usado sin autorización, contacta inmediatamente al 
                equipo de moderación. Tomamos muy en serio la protección de la propiedad intelectual.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puedo publicar mi historia en otros lugares?",
          answer: (
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-700">
                  ¡Por supuesto! Tu historia es tuya.
                </p>
              </div>
              <p>
                Puedes publicar tu historia en blogs, redes sociales, libros, revistas, o cualquier 
                otro lugar que desees. No hay restricciones sobre dónde puedes usar tu propio trabajo.
              </p>
              <p className="text-sm text-gray-600">
                Solo te pedimos que menciones a Letranido si la historia ganó un premio en nuestros concursos.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puedo retirar mi historia de la plataforma?",
          answer: (
            <div className="space-y-3">
              <p>
                Sí, puedes eliminar tus historias desde tu perfil en cualquier momento.
              </p>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  <strong>Nota importante:</strong> Aunque elimines tu historia, puede que permanezca visible 
                  en los listados de concursos anteriores por su valor histórico en la competición.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Los comentarios y votos asociados también se eliminarán junto con la historia.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      title: "Votación y Comentarios",
      icon: Heart,
      color: "indigo",
      items: [
        {
          question: "¿Cómo funciona el sistema de votación?",
          answer: (
            <div className="space-y-3">
              <p>
                Durante la fase de votación, los miembros de la comunidad pueden leer todas las 
                historias enviadas y votar por sus favoritas.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Un voto = Un "me gusta" por historia</span>
                </div>
                <div className="text-sm text-gray-600 ml-6">
                  • Cada usuario puede votar por múltiples historias<br/>
                  • No puedes votar por tu propia historia<br/>
                  • Los votos son anónimos<br/>
                  • Puedes cambiar tus votos cuando quieras durante la fase de votación
                </div>
              </div>
            </div>
          ),
        },
        {
          question: "¿Puedo comentar en las historias?",
          answer: (
            <div className="space-y-3">
              <p>
                ¡Sí! Los comentarios son una parte importante de nuestra comunidad. Puedes dejar 
                feedback constructivo, elogios, o preguntas sobre las historias.
              </p>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Código de conducta:</strong> Mantén los comentarios respetuosos y constructivos. 
                  Los comentarios ofensivos o spam serán eliminados.
                </p>
              </div>
            </div>
          ),
        },
        {
          question: "¿Cuándo se anuncian los resultados?",
          answer: (
            <p>
              Los resultados se anuncian automáticamente al final del período de votación, 
              típicamente el último día del mes. Los ganadores reciben notificaciones especiales 
              y sus badges se actualizan inmediatamente.
            </p>
          ),
        },
      ],
    },
    {
      title: "Cuenta y Configuración",
      icon: Users,
      color: "purple",
      items: [
        {
          question: "¿Es gratis registrarse?",
          answer: (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium text-green-700">
                  ¡Sí, es completamente gratis!
                </p>
                <p className="text-sm text-green-600">
                  Registrarse y participar en la comunidad es gratuito.
                </p>
              </div>
              <p>
                Puedes participar en concursos, votar, comentar, y ganar badges sin ningún costo. 
                Nuestro objetivo es mantener la escritura creativa accesible para todos.
              </p>
            </div>
          ),
        },
        {
          question: "¿Cómo cambio mi información de perfil?",
          answer: (
            <div className="space-y-3">
              <p>Puedes actualizar tu perfil en cualquier momento:</p>
              <ol className="space-y-1 ml-4">
                <li>1. Ve a tu <Link to="/profile" className="text-indigo-600 hover:underline">perfil</Link></li>
                <li>2. Haz clic en "Editar perfil"</li>
                <li>3. Actualiza tu nombre</li>
                <li>4. Guarda los cambios</li>
              </ol>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Por ahora puedes cambiar tu nombre. Las opciones de biografía y foto de perfil 
                  se implementarán próximamente.
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Soporte y Contacto",
      icon: HelpCircle,
      color: "pink",
      items: [
        {
          question: "¿Cómo puedo contactar al equipo de soporte?",
          answer: (
            <div className="space-y-3">
              <p>Tenemos varios canales para ayudarte:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Email: soporte@letranido.com</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Tiempo de respuesta típico: 24-48 horas
              </p>
            </div>
          ),
        },
        {
          question: "¿Dónde puedo reportar contenido inapropiado?",
          answer: (
            <div className="space-y-3">
              <p>
                Si encuentras contenido que viola nuestras reglas comunitarias, puedes reportarlo:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Usa el botón "Reportar" en cada historia o comentario</li>
                <li>• Envía un email a moderacion@letranido.com</li>
                <li>• Describe específicamente qué regla se está violando</li>
              </ul>
              <p className="text-sm text-gray-600">
                Todos los reportes son revisados por nuestro equipo de moderación en menos de 24 horas.
              </p>
            </div>
          ),
        },
        {
          question: "¿Tienen alguna comunidad en redes sociales?",
          answer: (
            <div className="space-y-3">
              <p>¡Sí! Puedes encontrarnos en:</p>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                  <span className="text-sm">Instagram: @letranido</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Síguenos para actualizaciones, consejos de escritura, y anuncios de nuevos concursos.
              </p>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SEOHead
        title="Preguntas Frecuentes (FAQ)"
        description="Encuentra respuestas a las preguntas más comunes sobre Letranido: concursos, badges, derechos de autor, votación y más."
        keywords="FAQ, preguntas frecuentes, ayuda, soporte, letranido, concursos de escritura"
        url="/faq"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full mb-6 shadow-xl">
            <HelpCircle className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas saber sobre Letranido, nuestra comunidad de escritores 
            y cómo participar en nuestros concursos mensuales.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqSections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            const colorClasses = {
              indigo: "from-indigo-500 to-indigo-600",
              purple: "from-purple-500 to-purple-600",
              pink: "from-pink-500 to-pink-600",
            };

            return (
              <div key={sectionIndex} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
                {/* Section Header */}
                <div className={`bg-gradient-to-r ${colorClasses[section.color]} p-6 text-white`}>
                  <div className="flex items-center gap-3">
                    <SectionIcon className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                  </div>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-gray-200">
                  {section.items.map((item, itemIndex) => {
                    const globalIndex = sectionIndex * 1000 + itemIndex; // Ensure unique index
                    const isOpen = openItems.has(globalIndex);

                    return (
                      <div key={itemIndex}>
                        <button
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 pr-4">
                              {item.question}
                            </h3>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-6 pb-6">
                            <div className="text-gray-700 leading-relaxed">
                              {typeof item.answer === "string" ? (
                                <p>{item.answer}</p>
                              ) : (
                                item.answer
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-8 border border-indigo-200 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            ¿No encontraste lo que buscabas?
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            Nuestro equipo de soporte está aquí para ayudarte con cualquier pregunta adicional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:soporte@letranido.com"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Mail className="h-5 w-5 mr-2" />
              Contactar Soporte
            </a>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Volver al Inicio
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            to="/contest/current"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Trophy className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Concurso Actual</h3>
            <p className="text-sm text-gray-600">Ver el concurso del mes en curso</p>
          </Link>

          <Link
            to="/profile"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Mi Perfil</h3>
            <p className="text-sm text-gray-600">Gestiona tu cuenta y configuración</p>
          </Link>

          <Link
            to="/community-guidelines"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Shield className="h-8 w-8 text-pink-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Reglas de la Comunidad</h3>
            <p className="text-sm text-gray-600">Conoce nuestras normas de convivencia</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;