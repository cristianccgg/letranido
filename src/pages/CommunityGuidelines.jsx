// pages/CommunityGuidelines.jsx - GUÍAS DE COMUNIDAD Y PROTECCIÓN DE DERECHOS
import {
  Users,
  Shield,
  Heart,
  AlertTriangle,
  FileText,
  Trophy,
  Flag,
} from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const CommunityGuidelines = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Guías de la Comunidad"
        description="Conoce las guías de la comunidad de Letranido. Reglas sobre derechos de autor, comportamiento respetuoso, contenido apropiado y moderación."
        keywords="guías comunidad, reglas comunidad, comportamiento escritores, moderación, derechos autor, letranido"
        url="/community-guidelines"
      />
      
      <div className="prose prose-gray max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Guías de la Comunidad
          </h1>
          <p className="text-xl text-gray-600">
            Construyendo una comunidad respetuosa y creativa en Letranido
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: {new Date().toLocaleDateString("es-ES")}
          </p>
        </div>

        {/* Misión de la Comunidad */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
              <Heart className="h-6 w-6 mr-2" />
              Nuestra Misión Comunitaria
            </h2>
            <p className="text-blue-800 mb-4">
              Letranido es un espacio donde escritores de todos los niveles
              pueden compartir, aprender y crecer juntos. Creemos en la
              creatividad auténtica, el respeto mutuo y la protección de la
              propiedad intelectual.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">✍️</div>
                <strong>Creatividad Auténtica</strong>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🤝</div>
                <strong>Respeto Mutuo</strong>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <strong>Protección de Derechos</strong>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Derechos de Autor y Originalidad */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-600" />
            1. Protección de Derechos de Autor (CRÍTICO)
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-red-900 mb-3">
              🚨 REGLA FUNDAMENTAL: SOLO CONTENIDO ORIGINAL
            </h3>
            <p className="text-red-800 mb-4">
              <strong>Cada palabra de tu historia debe ser tuya.</strong>{" "}
              Letranido protege férreamente los derechos de autor tanto de
              nuestros usuarios como de creadores externos.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  ✅ PERMITIDO:
                </h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Tu escritura 100% original</li>
                  <li>• Inspiración en temas generales</li>
                  <li>
                    • Géneros establecidos (ciencia ficción, romance, etc.)
                  </li>
                  <li>• Conceptos universales (amor, pérdida, aventura)</li>
                  <li>• Referencias culturales de dominio público</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  ❌ ESTRICTAMENTE PROHIBIDO:
                </h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Copiar texto de libros, películas, series</li>
                  <li>• Parafrasear obras existentes</li>
                  <li>• Fan fiction de universos con copyright</li>
                  <li>• Usar personajes de otros autores</li>
                  <li>• Contenido generado por IA</li>
                  <li>• Traducir obras protegidas</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            1.1 TUS Derechos Como Creador
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <ul className="text-green-800 space-y-2">
              <li>
                ✅ <strong>Eres el dueño absoluto</strong> de tus historias
                originales
              </li>
              <li>
                ✅ <strong>Letranido NO reclama</strong> derechos sobre tu
                contenido
              </li>
              <li>
                ✅ <strong>Puedes publicar</strong> tus historias en otros
                lugares
              </li>
              <li>
                ✅ <strong>Puedes retirar</strong> tu contenido cuando quieras
              </li>
              <li>
                ✅ <strong>Tienes crédito</strong> por tu trabajo siempre
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            1.2 Licencia Limitada a Letranido
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm mb-2">
              Al publicar tu historia, nos das una{" "}
              <strong>licencia limitada</strong> para:
            </p>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Mostrar tu historia en la plataforma</li>
              <li>• Permitir que otros usuarios la lean y voten</li>
              <li>• Incluirla en rankings y concursos</li>
              <li>
                • Mencionar historias ganadoras en redes sociales (con tu
                crédito)
              </li>
            </ul>
            <p className="text-blue-800 text-sm mt-2">
              <strong>NO nos das derecho a:</strong> Vender, licenciar a
              terceros, modificar, o usar comercialmente tu contenido.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            1.3 Detección y Consecuencias
          </h3>
          <p className="mb-4">
            Usamos herramientas automatizadas y revisión manual para detectar
            plagio. Si encontramos violaciones:
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="text-yellow-800 space-y-1 text-sm">
              <li>
                <strong>1ra vez:</strong> Advertencia y remoción del contenido
              </li>
              <li>
                <strong>2da vez:</strong> Suspensión temporal de 30 días
              </li>
              <li>
                <strong>3ra vez:</strong> Suspensión permanente de la cuenta
              </li>
              <li>
                <strong>Casos graves:</strong> Reporte a autoridades de derechos
                de autor
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Comportamiento Respetuoso */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2 text-green-600" />
            2. Comportamiento en la Comunidad
          </h2>

          <h3 className="text-lg font-semibold mb-3">
            2.1 Interacciones Positivas
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-900 mb-2">
              🌟 Lo que amamos ver:
            </h4>
            <ul className="text-green-800 space-y-2">
              <li>
                • <strong>Retroalimentación constructiva:</strong> "Me gustó X,
                podrías mejorar Y"
              </li>
              <li>
                • <strong>Apoyo genuino:</strong> Celebrar los éxitos de otros
              </li>
              <li>
                • <strong>Diversidad de voces:</strong> Respetar diferentes
                estilos y perspectivas
              </li>
              <li>
                • <strong>Mentoría informal:</strong> Escritores experimentados
                ayudando a novatos
              </li>
              <li>
                • <strong>Participación activa:</strong> Leer, votar y comentar
                regularmente
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            2.2 Comentarios y Críticas
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                ✅ Crítica Constructiva:
              </h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• "El diálogo se sintió natural"</li>
                <li>• "El plot twist me sorprendió"</li>
                <li>• "Podrías desarrollar más el personaje"</li>
                <li>• "El final fue satisfactorio"</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">
                ❌ Crítica Destructiva:
              </h4>
              <ul className="text-red-800 text-sm space-y-1">
                <li>• "Esta historia es terrible"</li>
                <li>• "No sabes escribir"</li>
                <li>• "Perdí mi tiempo leyendo esto"</li>
                <li>• Ataques personales al autor</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Contenido Apropiado */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-purple-600" />
            3. Estándares de Contenido
          </h2>

          <h3 className="text-lg font-semibold mb-3">
            3.1 Contenido Bienvenido
          </h3>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <ul className="text-purple-800 space-y-2">
              <li>
                • <strong>Todos los géneros:</strong> Ficción, fantasía,
                realismo, ciencia ficción, terror moderado
              </li>
              <li>
                • <strong>Temas maduros apropiados:</strong> Pérdida,
                relaciones, dilemas morales
              </li>
              <li>
                • <strong>Diversidad:</strong> Historias que reflejen diferentes
                culturas y experiencias
              </li>
              <li>
                • <strong>Experimentación:</strong> Nuevos estilos narrativos y
                estructuras
              </li>
              <li>
                • <strong>Contenido educativo:</strong> Historias que enseñen o
                informen
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            3.2 Clasificación de Contenido Maduro
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800 mb-3">
              <strong>
                Marca como "Contenido Maduro" si tu historia incluye:
              </strong>
            </p>
            <ul className="text-orange-800 space-y-1 text-sm">
              <li>• Violencia moderada (peleas, conflictos armados)</li>
              <li>• Lenguaje fuerte ocasional</li>
              <li>• Temas psicológicamente intensos (trauma, depresión)</li>
              <li>• Situaciones de vida o muerte</li>
              <li>• Referencias a alcohol/drogas en contexto apropiado</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            3.3 Contenido Estrictamente Prohibido
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  🚫 Contenido Sexual/Adulto:
                </h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Contenido pornográfico o sexualmente explícito</li>
                  <li>• Desnudez detallada</li>
                  <li>• Fetichismo o parafilias</li>
                  <li>• Cualquier contenido sexual con menores</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  ⚡ Violencia Extrema:
                </h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Tortura gráfica detallada</li>
                  <li>• Mutilación o gore extremo</li>
                  <li>• Violencia sexual</li>
                  <li>• Promoción de autolesión</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  💬 Discurso de Odio:
                </h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Discriminación racial, étnica o religiosa</li>
                  <li>• Homofobia, transfobia o misoginia</li>
                  <li>• Promoción de supremacía o extremismo</li>
                  <li>• Ataques a grupos vulnerables</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  ⚖️ Contenido Ilegal:
                </h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Promoción de actividades ilegales</li>
                  <li>• Instrucciones para fabricar armas/drogas</li>
                  <li>• Amenazas reales a personas</li>
                  <li>• Violación de privacidad de individuos</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Sistema de Votación Justo */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
            4. Votación y Competencia Justa
          </h2>

          <h3 className="text-lg font-semibold mb-3">
            4.1 Principios de Votación Justa
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <ul className="text-yellow-800 space-y-2">
              <li>
                • <strong>Un voto por historia por usuario:</strong> No se
                permite votación múltiple
              </li>
              <li>
                • <strong>No auto-votación:</strong> No puedes votar por tu
                propia historia
              </li>
              <li>
                • <strong>Votación basada en mérito:</strong> Vota por calidad,
                no por amistad
              </li>
              <li>
                • <strong>Respeto por todas las historias:</strong> Lee antes de
                votar
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            4.2 Comportamientos Prohibidos
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-900 mb-2">
              ❌ Manipulación del Sistema:
            </h4>
            <ul className="text-red-800 space-y-1 text-sm">
              <li>• Crear cuentas múltiples para votar</li>
              <li>• Intercambio de votos ("vota por mí y yo voto por ti")</li>
              <li>• Pedir votos en redes sociales externas</li>
              <li>• Usar bots o scripts automatizados</li>
              <li>• Votar sin leer la historia</li>
              <li>• Coordinar campañas de votación masiva</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            4.3 Detección Automática
          </h3>
          <p className="mb-4 text-gray-700">
            Nuestro sistema detecta automáticamente patrones sospechosos de
            votación:
          </p>
          <ul className="list-disc pl-6 mb-4 text-sm text-gray-700">
            <li>Múltiples votos desde la misma IP</li>
            <li>Cuentas creadas solo para votar</li>
            <li>Patrones de votación no naturales</li>
            <li>Actividad coordinada entre cuentas</li>
          </ul>
        </section>

        {/* 5. Moderación y Reportes */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Flag className="h-6 w-6 mr-2 text-blue-600" />
            5. Moderación Comunitaria
          </h2>

          <h3 className="text-lg font-semibold mb-3">
            5.1 Cómo Reportar Contenido
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 mb-3">
              <strong>Si encuentras contenido que viola estas guías:</strong>
            </p>
            <ol className="text-blue-800 space-y-2 text-sm">
              <li>
                <strong>1.</strong> Haz clic en el botón "Reportar" en la
                historia o comentario
              </li>
              <li>
                <strong>2.</strong> Selecciona la razón específica del reporte
              </li>
              <li>
                <strong>3.</strong> Proporciona detalles adicionales si es
                necesario
              </li>
              <li>
                <strong>4.</strong> Nuestro equipo revisará en 24-48 horas
              </li>
            </ol>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            5.2 Proceso de Moderación
          </h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">👀</div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Revisión</h4>
              <p className="text-gray-600 text-sm">
                Evaluamos cada reporte manualmente
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Decisión</h4>
              <p className="text-gray-600 text-sm">
                Aplicamos las guías consistentemente
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📧</div>
              <h4 className="font-semibold text-gray-900 mb-2">
                3. Comunicación
              </h4>
              <p className="text-gray-600 text-sm">
                Notificamos la decisión a todos los involucrados
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            5.3 Escalamiento de Consecuencias
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span className="text-yellow-800">
                  <strong>Advertencia:</strong> Notificación educativa +
                  remoción de contenido
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span className="text-yellow-800">
                  <strong>Suspensión temporal:</strong> 7-30 días sin acceso a
                  publicar
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span className="text-yellow-800">
                  <strong>Suspensión permanente:</strong> Pérdida permanente de
                  acceso
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Apelaciones */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Proceso de Apelación
          </h2>

          <h3 className="text-lg font-semibold mb-3">
            6.1 ¿Crees que hubo un error?
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 mb-3">
              Entendemos que los errores pueden ocurrir. Si crees que tu
              contenido fue removido incorrectamente:
            </p>
            <ol className="text-green-800 space-y-2 text-sm">
              <li>
                <strong>1.</strong> Envía un email a appeals@letranido.com
              </li>
              <li>
                <strong>2.</strong> Incluye el ID de tu historia y una
                explicación detallada
              </li>
              <li>
                <strong>3.</strong> Un moderador diferente revisará tu caso
              </li>
              <li>
                <strong>4.</strong> Recibirás una respuesta en 3-5 días hábiles
              </li>
            </ol>
          </div>

          <h3 className="text-lg font-semibold mb-3">
            6.2 Criterios para Apelaciones Exitosas
          </h3>
          <ul className="list-disc pl-6 mb-4 text-sm text-gray-700">
            <li>Evidencia clara de que no violaste las guías</li>
            <li>Contexto adicional que no fue considerado inicialmente</li>
            <li>Error demostrable en la interpretación de las reglas</li>
            <li>Problemas técnicos que causaron malentendidos</li>
          </ul>
        </section>

        {/* 7. Responsabilidades de la Plataforma */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-purple-600" />
            7. Nuestras Responsabilidades
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">
                ✅ Nos comprometemos a:
              </h3>
              <ul className="text-purple-800 space-y-2 text-sm">
                <li>• Proteger tu contenido original</li>
                <li>• Moderar de forma consistente y justa</li>
                <li>• Responder a reportes rápidamente</li>
                <li>• Mantener un ambiente seguro</li>
                <li>• Ser transparentes en nuestras decisiones</li>
                <li>• Dar oportunidades de apelación</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                ⚖️ Limitaciones legales:
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• No podemos garantizar detección 100% de plagio</li>
                <li>• No somos responsables por disputas entre usuarios</li>
                <li>• No proporcionamos asesoría legal</li>
                <li>• No moderamos contenido en tiempo real</li>
                <li>• Casos complejos pueden tomar más tiempo</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 8. Evolución de las Guías */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. Evolución de la Comunidad
          </h2>

          <p className="mb-4 text-gray-700">
            Estas guías evolucionan con nuestra comunidad. Los cambios
            importantes incluirán:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Consulta a la comunidad antes de cambios mayores</li>
            <li>Notificación de 30 días para nuevas políticas</li>
            <li>Período de retroalimentación y ajustes</li>
            <li>Implementación gradual cuando sea posible</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Tu voz importa:</strong> Envía sugerencias para mejorar
              estas guías a community@letranido.com. Las mejores ideas serán
              implementadas.
            </p>
          </div>
        </section>

        {/* Footer de Contacto */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-center">
              🤝 Construyamos juntos una comunidad excepcional
            </h3>

            <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-lg mb-2">📧</div>
                <strong>Preguntas generales:</strong>
                <br />
                community@letranido.com
              </div>
              <div>
                <div className="text-lg mb-2">🚨</div>
                <strong>Reportar problemas:</strong>
                <br />
                reports@letranido.com
              </div>
              <div>
                <div className="text-lg mb-2">⚖️</div>
                <strong>Apelaciones:</strong>
                <br />
                appeals@letranido.com
              </div>
            </div>

            <p className="text-center text-gray-600 text-sm mt-4">
              <strong>Tiempo de respuesta:</strong> 24-48 horas para reportes
              urgentes, 3-5 días hábiles para consultas generales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
