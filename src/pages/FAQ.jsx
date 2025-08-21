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
  Zap,
  MessageCircle,
  MessageSquare,
  Vote,
  Crown,
  Medal,
  TrendingUp,
  Instagram,
  Facebook,
} from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";
import FeedbackModal from "../components/modals/FeedbackModal";

const FAQ = () => {
  const [openItems, setOpenItems] = useState(new Set([0])); // Primer item abierto por defecto
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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
      title: "Retos y Participación",
      icon: Trophy,
      color: "indigo",
      items: [
        {
          question: "¿Cómo funciona el sistema de retos?",
          answer: (
            <div className="space-y-3">
              <p>
                Cada mes lanzamos un nuevo reto con un prompt único. El
                proceso tiene tres fases:
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <PenTool className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <strong className="text-indigo-700 dark:text-indigo-300">
                      Fase de Envío
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Los escritores envían sus historias basadas en el prompt
                      del mes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Heart className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <strong className="text-purple-700 dark:text-purple-300">
                      Fase de Votación
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      La comunidad lee todas las historias y elige sus 3
                      favoritas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <Trophy className="h-5 w-5 text-pink-600 mt-1" />
                  <div>
                    <strong className="text-pink-700 dark:text-pink-300">
                      Resultados
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
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
              <p className="font-medium text-green-700 dark:text-green-400">
                ¡Por supuesto! Letranido está diseñado para escritores de todos
                los niveles.
              </p>
              <p>
                No importa si nunca has escrito una historia antes o si eres un
                autor experimentado. Nuestra comunidad es muy acogedora y
                siempre está dispuesta a ayudar y dar feedback constructivo.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  💡 <strong>Tip:</strong> Tu primera historia te dará
                  automáticamente el badge "Primera Pluma".
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
                Sí, cada reto tiene un límite de palabras específico que
                depende de la temática y el tipo de reto.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <ul className="space-y-2">
                  <li>
                    <strong>Rango general:</strong> Mínimo 100 - Máximo 1,000
                    palabras
                  </li>
                  <li>
                    <strong>Puede variar:</strong> Algunos retos pueden
                    tener límites diferentes
                  </li>
                  <li>
                    <strong>Siempre especificado:</strong> El límite exacto se
                    muestra en cada prompt
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Revisa siempre los detalles del reto actual para conocer el
                límite específico de ese mes.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puedo editar mi historia después de enviarla?",
          answer: (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-700">
                    Sí, durante la fase de envío
                  </p>
                  <p className="text-sm text-green-600">
                    Puedes editar tu historia libremente mientras el reto
                    esté en fase de envío.
                  </p>
                </div>
              </div>
              <p>
                Una vez que termine la fase de envío y comience la votación, las
                historias quedan bloqueadas para mantener la integridad del
                reto.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Aprovecha todo el período de envío para
                  perfeccionar tu historia antes del cierre.
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
                Si no logras enviar tu historia antes del cierre del reto,
                tendrás que esperar al siguiente mes.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Consejo:</strong> ¡No dejes todo para el último
                  momento! Tienes todo el mes para escribir y perfeccionar tu
                  historia.
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Recuerda que siempre puedes participar en el siguiente reto
                mensual con un nuevo prompt.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      title: "Sistema de Karma Rankings",
      icon: Zap,
      color: "indigo",
      items: [
        {
          question: "¿Qué es el sistema de karma rankings?",
          answer: (
            <div className="space-y-4">
              <p>
                El sistema de karma es una forma de reconocer y visualizar la
                participación activa de los miembros en nuestra comunidad. Cada
                acción que realizas en Letranido te otorga puntos de karma, y
                estos puntos determinan tu posición en el ranking comunitario.
              </p>
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                  <h4 className="font-semibold text-primary-800 dark:text-primary-300">
                    ¿Por qué karma?
                  </h4>
                </div>
                <p className="text-primary-700 dark:text-primary-300 text-sm">
                  El karma incentiva la participación positiva, premia a quienes
                  contribuyen activamente con historias, comentarios
                  constructivos y votos, y crea un ambiente colaborativo donde
                  todos ganan por participar.
                </p>
              </div>
            </div>
          ),
        },
        {
          question: "¿Cómo puedo ganar puntos de karma?",
          answer: (
            <div className="space-y-4">
              <p>
                Puedes ganar karma de múltiples formas. Cada acción en la
                comunidad tiene un valor específico:
              </p>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <PenTool className="h-5 w-5 text-primary-600" />
                  <div>
                    <strong className="text-primary-700 dark:text-primary-300">
                      Publicar historia: +15 puntos
                    </strong>
                    <p className="text-sm text-primary-600 dark:text-primary-300">
                      La acción más valiosa - compartir tu creatividad
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <strong className="text-green-700 dark:text-green-300">
                      Recibir comentario: +3 puntos
                    </strong>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Tu historia genera conversación
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-800/20 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <strong className="text-blue-700 dark:text-blue-300">
                      Dar comentario: +2 puntos
                    </strong>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Ayudar a otros escritores con feedback
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Heart className="h-5 w-5 text-purple-600" />
                  <div>
                    <strong className="text-purple-700 dark:text-purple-300">
                      Recibir like: +2 puntos
                    </strong>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      Tu historia gusta a la comunidad
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Vote className="h-5 w-5 text-orange-600" />
                  <div>
                    <strong className="text-orange-700 dark:text-orange-300">
                      Votar: +1 punto
                    </strong>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      Participar en la votación democrática
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <strong className="text-yellow-700 dark:text-yellow-300">
                      Ganar reto: +75 puntos
                    </strong>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      El máximo reconocimiento
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-red-800/20 rounded-lg">
                  <Medal className="h-5 w-5 text-pink-600" />
                  <div>
                    <strong className="text-pink-700 dark:text-pink-300">
                      Ser finalista: +30 puntos
                    </strong>
                    <p className="text-sm text-pink-600 dark:text-pink-300">
                      Entre los mejores del mes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          question: "¿Dónde puedo ver el ranking de karma?",
          answer: (
            <div className="space-y-4">
              <p>
                Puedes acceder al ranking de karma desde cualquier página de
                Letranido:
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Trophy className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                        Botón Rankings
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Busca el botón flotante "Rankings Karma" en el lado
                        izquierdo de tu pantalla. Haz clic para abrir el sidebar
                        con el ranking completo.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">
                      ¿Sabías qué?
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    El ranking se actualiza en tiempo real y muestra a todos los
                    usuarios con karma, incluso aquellos que solo votan o
                    comentan sin publicar historias.
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          question: "¿Puedo perder karma?",
          answer: (
            <div className="space-y-4">
              <p>
                <strong>No, nunca pierdes karma.</strong> El sistema está
                diseñado para ser positivo e incentivador:
              </p>
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">
                      Solo se suma
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Cada acción positiva suma puntos. No hay penalizaciones ni
                    formas de perder karma.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">
                      Permanente
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Tu karma acumulado es permanente y refleja tu historia de
                    participación en la comunidad.
                  </p>
                </div>
              </div>
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
                Los badges son reconocimientos especiales que celebran tus
                logros como escritor en la comunidad.
              </p>
              <div className="grid gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-purple-800/20  rounded-lg">
                  <h4 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                    🖋️ Badges de Escritura
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      • <strong>Primera Pluma:</strong> Envía tu primera
                      historia
                    </li>
                    <li>
                      • <strong>Escritor Constante:</strong> Participa en 3
                      retos
                    </li>
                    <li>
                      • <strong>Veterano:</strong> Participa en 10 retos
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-800/20 rounded-lg">
                  <h4 className="font-semibold text-purple-700 dark:text-indigo-300 mb-2">
                    🏆 Badges de Victoria
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      • <strong>Ganador:</strong> Gana un reto mensual
                    </li>
                    <li>
                      • <strong>Finalista:</strong> Queda en el top 3
                    </li>
                    <li>
                      • <strong>Veterano Ganador:</strong> Gana 3 retos
                    </li>
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
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300 mt-1" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Los badges son permanentes
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Una vez que ganas un badge, es tuyo para siempre.
                  </p>
                </div>
              </div>
              <p>
                Los badges representan logros que ya has alcanzado, por lo que
                no se pueden quitar. Tu colección solo puede crecer con el
                tiempo.
              </p>
            </div>
          ),
        },
        {
          question: "¿Los badges aparecen en mi perfil público?",
          answer: (
            <p>
              Sí, todos tus badges se muestran orgullosamente en tu perfil
              público. Otros usuarios pueden ver tus logros cuando visitan tu
              perfil o cuando comentas en historias. Es una forma de mostrar tu
              experiencia y trayectoria en la comunidad.
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
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-300 mt-1" />
                <div>
                  <p className="font-bold text-green-700 dark:text-green-300 text-lg">
                    ¡Absolutamente sí!
                  </p>
                  <p className="text-green-600 dark:text-green-300">
                    Mantienes todos los derechos de autor sobre tus historias.
                    Son tuyas y siempre lo serán.
                  </p>
                </div>
              </div>
              <p>
                Letranido solo proporciona la plataforma para compartir tu
                trabajo. No tenemos ningún derecho sobre tu contenido más allá
                del permiso básico para mostrarlo en el sitio web.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puede alguien más usar mi historia sin permiso?",
          answer: (
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-700">
                <p className="font-medium text-red-700 dark:text-red-300">
                  No, está estrictamente prohibido
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Nadie puede republicar, copiar o usar tu historia sin tu
                  permiso expreso.
                </p>
              </div>
              <p>
                Si encuentras tu trabajo siendo usado sin autorización, contacta
                inmediatamente al equipo de moderación. Tomamos muy en serio la
                protección de la propiedad intelectual.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puedo publicar mi historia en otros lugares?",
          answer: (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  ¡Por supuesto! Tu historia es tuya.
                </p>
              </div>
              <p>
                Puedes publicar tu historia en blogs, redes sociales, libros,
                revistas, o cualquier otro lugar que desees. No hay
                restricciones sobre dónde puedes usar tu propio trabajo.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Solo te pedimos que menciones a Letranido si la historia ganó un
                premio en nuestros retos.
              </p>
            </div>
          ),
        },
        {
          question: "¿Puedo retirar mi historia de la plataforma?",
          answer: (
            <div className="space-y-3">
              <p>
                Sí, puedes eliminar tus historias desde tu perfil en cualquier
                momento.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Nota importante:</strong> Aunque elimines tu historia,
                  puede que permanezca visible en los listados de retos
                  anteriores por su valor histórico en la competición.
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Los comentarios y votos asociados también se eliminarán junto
                con la historia.
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
                Durante la fase de votación, los miembros de la comunidad pueden
                leer todas las historias enviadas y elegir sus favoritas.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    Tienes 3 votos por reto
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                  • Máximo 3 votos por usuario en cada reto
                  <br />
                  • No puedes votar por tu propia historia
                  <br />
                  • Los votos son anónimos durante la votación
                  <br />• Puedes cambiar tus votos cuando quieras (quitar uno
                  para votar por otra historia)
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Estrategia:</strong> Lee todas las historias antes de
                  votar. Una vez que uses tus 3 votos, tendrás que quitar un
                  voto existente para votar por una historia diferente.
                </p>
              </div>
            </div>
          ),
        },
        {
          question: "¿Puedo comentar en las historias?",
          answer: (
            <div className="space-y-3">
              <p>
                ¡Sí! Los comentarios son una parte importante de nuestra
                comunidad. Puedes dejar feedback constructivo, elogios, o
                preguntas sobre las historias.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Código de conducta:</strong> Mantén los comentarios
                  respetuosos y constructivos. Los comentarios ofensivos o spam
                  serán eliminados.
                </p>
              </div>
            </div>
          ),
        },
        {
          question: "¿Cuándo se anuncian los resultados?",
          answer: (
            <p>
              Los resultados se anuncian automáticamente al final del período de
              votación, típicamente el último día del mes. Los ganadores reciben
              notificaciones especiales y sus badges se actualizan
              inmediatamente.
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
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="font-medium text-green-700 dark:text-green-300">
                  ¡Sí, es completamente gratis!
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Registrarse y participar en la comunidad es gratuito.
                </p>
              </div>
              <p>
                Puedes participar en retos, votar, comentar, y ganar badges
                sin ningún costo. Nuestro objetivo es mantener la escritura
                creativa accesible para todos.
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
                <li>
                  1. Ve a tu{" "}
                  <Link
                    to="/profile"
                    className="text-indigo-600 dark:text-purple-300 hover:underline"
                  >
                    perfil
                  </Link>
                </li>
                <li>2. Haz clic en "Editar perfil"</li>
                <li>3. Actualiza tu nombre</li>
                <li>4. Guarda los cambios</li>
              </ol>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Nota:</strong> Por ahora puedes cambiar tu nombre. Las
                  opciones de biografía y foto de perfil se implementarán
                  próximamente.
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
              <p>Puedes escribirnos a:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <Mail className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                  <span className="text-sm">Email: info@letranido.com</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <MessageCircle className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                  <span className="text-sm">
                    O directamente desde este formulario:{" "}
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="text-blue-600 cursor-pointer dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors underline font-medium"
                    >
                      Enviar feedback
                    </button>
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
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
                Si encuentras contenido que viola nuestras reglas comunitarias,
                puedes reportarlo:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Usa el botón "Reportar" en cada historia o comentario</li>
                <li>• Envía un email a legal@letranido.com</li>
                <li>• Describe específicamente qué regla se está violando</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Todos los reportes son revisados por nuestro equipo de
                moderación en menos de 24 horas.
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
                <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <Instagram className="h-4 w-4 text-purple-500 dark:text-purple-300" />
                  <a
                    href="https://www.instagram.com/letranido"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm"
                  >
                    @letranido
                  </a>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <Facebook className="h-4 w-4 text-purple-500 dark:text-purple-300" />
                  <a
                    href="https://web.facebook.com/profile.php?id=61579066655489"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm"
                  >
                    Facebook
                  </a>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Síguenos para actualizaciones, consejos de escritura, y anuncios
                de nuevos retos.
              </p>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <SEOHead
        title="Preguntas Frecuentes (FAQ)"
        description="Encuentra respuestas a las preguntas más comunes sobre Letranido: retos, badges, derechos de autor, votación y más."
        keywords="FAQ, preguntas frecuentes, ayuda, soporte, letranido, retos de escritura"
        url="/faq"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full mb-6 shadow-xl">
            <HelpCircle className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Todo lo que necesitas saber sobre Letranido, nuestra comunidad de
            escritores y cómo participar en nuestros retos mensuales.
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
              <div
                key={sectionIndex}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 dark:border-gray-700/40 overflow-hidden"
              >
                {/* Section Header */}
                <div
                  className={`bg-gradient-to-r ${colorClasses[section.color]} p-6 text-white`}
                >
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
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
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
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
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
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-700 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¿No encontraste lo que buscabas?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
            Nuestro equipo de soporte está aquí para ayudarte con cualquier
            pregunta adicional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@letranido.com"
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
            className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 dark:border-gray-700/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Trophy className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Concurso Actual
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ver el reto del mes en curso
            </p>
          </Link>

          <Link
            to="/profile"
            className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 dark:border-gray-700/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Mi Perfil
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Gestiona tu cuenta y configuración
            </p>
          </Link>

          <Link
            to="/community-guidelines"
            className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 dark:border-gray-700/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Shield className="h-8 w-8 text-pink-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Reglas de la Comunidad
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Conoce nuestras normas de convivencia
            </p>
          </Link>
        </div>
      </div>
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
};

export default FAQ;
