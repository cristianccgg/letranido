import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import {
  BookOpen,
  PenTool,
  Lightbulb,
  Target,
  Users,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Heart,
  Trophy,
  Edit3,
  FileText,
  MessageCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
} from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const WritingResources = () => {
  const [expandedSections, setExpandedSections] = useState(new Set([0]));
  const { isAuthenticated, openAuthModal } = useGlobalApp();

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const resourceSections = [
    {
      title: "Fundamentos de la Escritura Creativa",
      icon: BookOpen,
      color: "indigo",
      description: "Bases sólidas para comenzar tu viaje como escritor",
      resources: [
        {
          title: "Cómo crear personajes memorables",
          description: "Técnicas para desarrollar protagonistas y secundarios que conecten con los lectores.",
          tips: [
            "Dale a cada personaje una motivación clara y específica",
            "Crea contradicciones internas que los hagan humanos",
            "Desarrolla un pasado que explique sus acciones presentes",
            "Asigna manías, gestos y formas de hablar únicas",
            "Haz que evolucionen a lo largo de la historia"
          ]
        },
        {
          title: "Estructura narrativa: Los tres actos",
          description: "El esquema clásico que funciona en casi cualquier género literario.",
          tips: [
            "Acto I (25%): Presenta el mundo, personajes y conflicto principal",
            "Punto de giro 1: El momento que lanza la historia real",
            "Acto II (50%): Desarrollo del conflicto, obstáculos crecientes",
            "Punto medio: Revelación o giro que cambia todo",
            "Acto III (25%): Clímax, resolución y conclusión satisfactoria"
          ]
        },
        {
          title: "Show, don't tell: La regla de oro",
          description: "Cómo mostrar emociones y situaciones sin explicarlas directamente.",
          tips: [
            "En lugar de 'Juan estaba nervioso', describe sus manos sudorosas",
            "Usa el entorno para reflejar el estado emocional",
            "Deja que las acciones revelen la personalidad",
            "Utiliza el diálogo para mostrar relaciones y conflictos",
            "Confía en la inteligencia de tus lectores"
          ]
        }
      ]
    },
    {
      title: "Técnicas Avanzadas de Narrativa",
      icon: Edit3,
      color: "purple",
      description: "Herramientas para escritores con experiencia",
      resources: [
        {
          title: "Manejo del tiempo narrativo",
          description: "Flashbacks, flashforwards y ritmo narrativo efectivo.",
          tips: [
            "Usa flashbacks solo cuando agreguen información crucial",
            "Marca claramente los cambios temporales",
            "Alterna entre escenas rápidas y lentas para crear ritmo",
            "El presente narrativo debe ser el tiempo principal",
            "Los saltos temporales deben servir a la historia, no confundir"
          ]
        },
        {
          title: "Punto de vista y voz narrativa",
          description: "Cómo elegir y mantener consistente la perspectiva narrativa.",
          tips: [
            "Primera persona: Intimidad pero limitación de perspectiva",
            "Tercera persona limitada: Balance entre intimidad y flexibilidad",
            "Tercera persona omnisciente: Control total pero menos intimidad",
            "Mantén consistente el punto de vista elegido",
            "La voz debe ser apropiada para el personaje y la historia"
          ]
        },
        {
          title: "Construcción de mundos convincentes",
          description: "Worldbuilding efectivo tanto para ficción realista como fantástica.",
          tips: [
            "Establece las reglas de tu mundo y respétalas",
            "No info-dumping: revela el mundo gradualmente",
            "Cada detalle debe servir a la historia",
            "Piensa en la historia, cultura y geografía",
            "Menos es más: sugiere más de lo que explicas"
          ]
        }
      ]
    },
    {
      title: "Géneros y Estilos Específicos",
      icon: Target,
      color: "pink",
      description: "Consejos especializados para diferentes tipos de narrativa",
      resources: [
        {
          title: "Escribir ciencia ficción efectiva",
          description: "Cómo balancear tecnología, ciencia y humanidad en tus historias.",
          tips: [
            "La tecnología debe servir a la historia, no dominarla",
            "Explora las consecuencias humanas de los cambios tecnológicos",
            "Investiga la ciencia real para mayor credibilidad",
            "Enfócate en 'qué pasaría si...' más que en explicaciones técnicas",
            "Los problemas deben seguir siendo fundamentalmente humanos"
          ]
        },
        {
          title: "Tensión y suspense en el thriller",
          description: "Técnicas para mantener al lector en vilo página tras página.",
          tips: [
            "Alternar entre revelación y ocultación de información",
            "Usa deadlines y consecuencias claras",
            "Cada capítulo debe terminar con una pregunta",
            "Planta pistas pero no reveles todo de inmediato",
            "La tensión se construye con lo que NO dices"
          ]
        },
        {
          title: "Romance creíble y emotivo",
          description: "Cómo escribir relaciones amorosas que conecten con los lectores.",
          tips: [
            "Desarrolla la atracción gradualmente, no instantáneamente",
            "Crea conflictos reales, no malentendidos forzados",
            "Ambos personajes deben tener agencia en la relación",
            "Muestra compatibilidad más allá de la atracción física",
            "El romance debe contribuir al arco narrativo general"
          ]
        }
      ]
    },
    {
      title: "Proceso de Escritura y Productividad",
      icon: Zap,
      color: "indigo",
      description: "Métodos para escribir de manera consistente y eficiente",
      resources: [
        {
          title: "Superar el bloqueo del escritor",
          description: "Estrategias prácticas para cuando las palabras no fluyen.",
          tips: [
            "Escribe mal antes que no escribir nada",
            "Cambia de ambiente o herramienta de escritura",
            "Escribe sobre por qué no puedes escribir",
            "Vuelve a leer lo último que escribiste",
            "Fija metas pequeñas y alcanzables (100 palabras)"
          ]
        },
        {
          title: "Rutinas de escritura efectivas",
          description: "Cómo establecer hábitos que fomenten la creatividad constante.",
          tips: [
            "Escribe a la misma hora cada día",
            "Crea un espacio dedicado solo a escribir",
            "Establece metas de tiempo, no solo de palabras",
            "Apaga las distracciones (internet, teléfono)",
            "Celebra los pequeños logros diarios"
          ]
        },
        {
          title: "Revisión y edición profesional",
          description: "Cómo mejorar tus textos con técnicas de autorevisión.",
          tips: [
            "Deja reposar el texto antes de revisar",
            "Lee en voz alta para detectar problemas de ritmo",
            "Revisa primero la estructura, luego los detalles",
            "Elimina palabras innecesarias sin piedad",
            "Cada frase debe avanzar la historia o desarrollar personajes"
          ]
        }
      ]
    },
    {
      title: "Comunidad y Feedback",
      icon: Users,
      color: "purple",
      description: "Cómo dar y recibir críticas constructivas",
      resources: [
        {
          title: "Dar feedback constructivo",
          description: "Cómo ayudar a otros escritores a mejorar sus textos.",
          tips: [
            "Siempre menciona algo que funciona bien primero",
            "Sé específico en tus observaciones",
            "Enfócate en el texto, no en el escritor",
            "Sugiere soluciones, no solo problemas",
            "Usa 'yo como lector sentí...' en lugar de 'esto está mal'"
          ]
        },
        {
          title: "Recibir críticas sin desanimarse",
          description: "Cómo procesar feedback y usarlo para crecer como escritor.",
          tips: [
            "Escucha sin defenderte inmediatamente",
            "Busca patrones en las críticas de diferentes lectores",
            "No todos los consejos son apropiados para tu historia",
            "Agradece el tiempo que invirtieron en leer",
            "Usa las críticas para mejorar, no para desanimarte"
          ]
        }
      ]
    },
    {
      title: "Inspiración y Creatividad",
      icon: Lightbulb,
      color: "pink",
      description: "Técnicas para generar ideas y mantener la chispa creativa",
      resources: [
        {
          title: "Generadores de ideas para historias",
          description: "Métodos comprobados para encontrar tu próxima gran historia.",
          tips: [
            "Combina dos noticias aleatorias del periódico",
            "Pregúntate '¿qué pasaría si...?' sobre situaciones cotidianas",
            "Observa a personas desconocidas e imagina sus historias",
            "Lleva siempre algo donde anotar ideas",
            "Lee géneros diferentes a los que escribes"
          ]
        },
        {
          title: "Ejercicios de escritura diarios",
          description: "Actividades cortas para mantener activa tu creatividad.",
          tips: [
            "Escribe 250 palabras sobre un objeto en tu habitación",
            "Describe el mismo lugar desde 3 puntos de vista diferentes",
            "Reescribe un cuento de hadas en la actualidad",
            "Escribe un diálogo sin usar verbos de diálogo",
            "Cuenta una historia completa en exactamente 55 palabras"
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SEOHead
        title="Recursos de Escritura"
        description="Guías, técnicas y consejos para mejorar tu escritura creativa. Desde fundamentos básicos hasta técnicas avanzadas de narrativa, todo lo que necesitas para crecer como escritor."
        keywords="recursos escritura, técnicas narrativa, consejos escritor, escritura creativa, guías literarias, mejora escritura"
        url="/writing-resources"
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full mb-6 shadow-xl">
            <BookOpen className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Recursos de Escritura
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Guías, técnicas y consejos curados para ayudarte a mejorar tu escritura creativa. 
            Desde fundamentos básicos hasta técnicas avanzadas.
          </p>
          
          {/* Quick stats */}
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-indigo-600 mb-1">20+</div>
              <div className="text-sm text-gray-600">Guías y tutoriales</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">6</div>
              <div className="text-sm text-gray-600">Categorías especializadas</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-pink-600 mb-1">100%</div>
              <div className="text-sm text-gray-600">Contenido gratuito</div>
            </div>
          </div>
        </div>

        {/* Resource Sections */}
        <div className="space-y-8">
          {resourceSections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.has(sectionIndex);
            const colorClasses = {
              indigo: {
                gradient: "from-indigo-500 to-indigo-600",
                bg: "bg-indigo-50",
                border: "border-indigo-200",
                text: "text-indigo-700"
              },
              purple: {
                gradient: "from-purple-500 to-purple-600",
                bg: "bg-purple-50",
                border: "border-purple-200",
                text: "text-purple-700"
              },
              pink: {
                gradient: "from-pink-500 to-pink-600",
                bg: "bg-pink-50",
                border: "border-pink-200",
                text: "text-pink-700"
              }
            };

            return (
              <div
                key={sectionIndex}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(sectionIndex)}
                  className={`w-full bg-gradient-to-r ${colorClasses[section.color].gradient} p-6 text-white text-left hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <SectionIcon className="h-8 w-8" />
                      <div>
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                        <p className="text-white/90 mt-1">{section.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6" />
                    ) : (
                      <ChevronDown className="h-6 w-6" />
                    )}
                  </div>
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="p-6">
                    <div className="grid gap-6">
                      {section.resources.map((resource, resourceIndex) => (
                        <div
                          key={resourceIndex}
                          className={`${colorClasses[section.color].bg} ${colorClasses[section.color].border} border rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {resource.title}
                              </h3>
                              <p className="text-gray-600 mb-3">
                                {resource.description}
                              </p>
                            </div>
                          </div>

                          {/* Tips list */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              Consejos clave:
                            </h4>
                            <ul className="space-y-2">
                              {resource.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-3">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700 text-sm leading-relaxed">
                                    {tip}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-8 border border-indigo-200 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para poner en práctica estos consejos?
          </h2>
          <p className="text-gray-700 mb-6 text-lg max-w-2xl mx-auto">
            Únete a nuestra comunidad de escritores y participa en concursos mensuales 
            donde podrás aplicar estas técnicas y recibir feedback de otros escritores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contest/current"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <PenTool className="h-5 w-5 mr-3" />
              Participar en concurso actual
              <ArrowRight className="h-5 w-5 ml-3" />
            </Link>
{!isAuthenticated && (
              <button
                onClick={() => openAuthModal("register")}
                className="inline-flex items-center px-8 py-4 rounded-xl bg-white border-2 border-indigo-200 text-indigo-700 font-bold text-lg hover:bg-indigo-50 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <Users className="h-5 w-5 mr-3" />
                Unirme a la comunidad
              </button>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            to="/faq"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <MessageCircle className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Preguntas Frecuentes</h3>
            <p className="text-sm text-gray-600">Respuestas a dudas comunes</p>
          </Link>

          <Link
            to="/community-guidelines"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Guías de Comunidad</h3>
            <p className="text-sm text-gray-600">Normas y mejores prácticas</p>
          </Link>

          <Link
            to="/"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            <Trophy className="h-8 w-8 text-pink-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Concursos Activos</h3>
            <p className="text-sm text-gray-600">Ver prompts y participar</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WritingResources;