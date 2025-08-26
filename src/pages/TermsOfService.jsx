// pages/TermsOfService.jsx - TÉRMINOS COMPLETOS
import { Shield, FileText, Users, Trophy, AlertTriangle } from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 min-h-screen">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Términos de Servicio"
        description="Lee los términos de servicio de Letranido. Conoce las reglas sobre originalidad, derechos de autor, retos y el comportamiento esperado en nuestra comunidad de escritores."
        keywords="términos de servicio, reglas, derechos de autor, originalidad, retos escritura, comunidad escritores, letranido"
        url="/terms"
      />

      <div className="prose prose-gray dark:prose-invert max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Términos de Servicio
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            Letranido - Comunidad de Escritura Creativa
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Última actualización: 14 de julio de 2025
          </p>
        </div>

        {/* 1. Aceptación de Términos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            1. Aceptación de Términos
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-blue-800 dark:text-blue-200">
              Al acceder y usar Letranido, aceptas cumplir estos términos de
              servicio. Si no estás de acuerdo, por favor no uses la plataforma.
            </p>
          </div>
          <p>
            Estos términos constituyen un acuerdo legal entre tú ("Usuario") y
            Letranido ("Nosotros", "Plataforma"). Nos reservamos el derecho de
            modificar estos términos en cualquier momento. Tu uso continuado de
            la plataforma constituye aceptación de los términos actualizados.
          </p>
        </section>

        {/* 2. Derechos de Autor y Contenido Original */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-600" />
            2. Derechos de Autor y Contenido Original
          </h2>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              IMPORTANTE - Originalidad Absoluta Requerida
            </h3>
            <ul className="text-red-800 dark:text-red-200 text-sm space-y-1">
              <li>✅ Tu contenido debe ser 100% original y de tu autoría</li>
              <li>
                ❌ Prohibido copiar, parafrasear o adaptar obras existentes
              </li>
              <li>
                ❌ Prohibido contenido basado en universos con derechos de autor
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            2.1 Propiedad Intelectual
          </h3>
          <p className="mb-4">
            Conservas todos los derechos de autor sobre tu contenido original.
            Al publicar en Letranido, nos otorgas una licencia no exclusiva,
            mundial, libre de regalías para:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Mostrar tu contenido en la plataforma</li>
            <li>Permitir que otros usuarios lean y voten por tu contenido</li>
            <li>
              Promocionar historias ganadoras en redes sociales (con crédito)
            </li>
            <li>Crear compilaciones de contenido destacado</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            2.2 Herramientas Permitidas
          </h3>
          <p className="mb-4">
            Puedes usar herramientas de apoyo que no generen contenido por ti:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              ✅ Correctores ortográficos y gramaticales (Grammarly, etc.)
            </li>
            <li>✅ Diccionarios y sinónimos</li>
            <li>✅ Herramientas de investigación y referencia</li>
            <li>✅ Editores de texto y procesadores de palabras</li>
          </ul>
          <p>
            <em>
              Enfoque: Que las palabras y la creatividad sean tuyas,
              independientemente de las herramientas de apoyo que uses.
            </em>
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            2.3 Verificación y Consecuencias
          </h3>
          <p>
            Nos reservamos el derecho de verificar la originalidad del
            contenido. Las violaciones pueden resultar en:
          </p>
          <ul className="list-disc pl-6">
            <li>Descalificación inmediata del reto</li>
            <li>Suspensión temporal o permanente de la cuenta</li>
            <li>Reporte a autoridades competentes en casos graves</li>
          </ul>
        </section>

        {/* 3. Contenido Permitido y Prohibido */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-yellow-600" />
            3. Contenido Permitido y Prohibido
          </h2>

          <h3 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-400">
            3.1 Contenido Permitido
          </h3>
          <ul className="list-disc pl-6 mb-4 text-green-800 dark:text-green-200">
            <li>Ficción original en todos los géneros</li>
            <li>
              Contenido maduro apropiadamente marcado (violencia moderada, temas
              adultos)
            </li>
            <li>Crítica social constructiva</li>
            <li>Exploración de temas complejos con sensibilidad</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-400">
            3.2 Contenido Estrictamente Prohibido
          </h3>
          <ul className="list-disc pl-6 mb-4 text-red-800 dark:text-red-200">
            <li>
              <strong>Sexual:</strong> Contenido pornográfico o sexualmente
              explícito
            </li>
            <li>
              <strong>Violencia:</strong> Violencia gráfica extrema, tortura
              detallada
            </li>
            <li>
              <strong>Odio:</strong> Discriminación por raza, género, religión,
              orientación
            </li>
            <li>
              <strong>Ilegal:</strong> Promoción de actividades ilegales
            </li>
            <li>
              <strong>Menores:</strong> Cualquier contenido sexual o violento
              hacia menores
            </li>
            <li>
              <strong>Personal:</strong> Ataques a personas reales
              identificables
            </li>
            <li>
              <strong>Desinformación:</strong> Información médica o científica
              falsa peligrosa
            </li>
          </ul>
        </section>

        {/* 4. retos y Votación */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
            4. Reglas de retos
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4.1 Elegibilidad
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              Usuarios mayores de 13 años (menores requieren supervisión
              parental)
            </li>
            <li>Una participación por persona por reto</li>
            <li>Cumplimiento de límites de palabras establecidos</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4.2 Sistema de Votación
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Votación abierta para todos los usuarios registrados</li>
            <li>Un voto (like) por historia por usuario</li>
            <li>Prohibido votar por tu propia historia</li>
            <li>Prohibidas cuentas múltiples para votación</li>
            <li>Detección automática de comportamiento sospechoso</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4.3 Premios y Reconocimientos
          </h3>
          <p className="mb-4">
            Los premios son principalmente reconocimientos virtuales (insignias,
            destacados). Cualquier premio físico será claramente especificado.
            No hay transferencia monetaria de premios virtuales.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4.4 Uso de Contenido Ganador para Promoción
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-blue-800 dark:text-blue-200 mb-3">
              <strong>Al ganar un reto y autorizar el uso promocional:</strong>
            </p>
            <ul className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
              <li>
                • <strong>Otorgas permiso</strong> para que Letranido use tu
                historia ganadora, nombre de usuario y fragmentos seleccionados
                con fines promocionales
              </li>
              <li>
                • <strong>Incluye uso en:</strong> Redes sociales, página web,
                newsletters, comunicados de prensa y material promocional
              </li>
              <li>
                • <strong>Siempre con crédito:</strong> Tu nombre de usuario
                será incluido en toda promoción
              </li>
              <li>
                • <strong>Sin compensación adicional:</strong> Esta autorización
                es parte del reconocimiento como ganador
              </li>
              <li>
                • <strong>Uso limitado:</strong> Solo para promoción de
                Letranido y reconocimiento del reto, no para uso comercial
                independiente
              </li>
            </ul>
          </div>

          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
            <strong>Nota importante:</strong> Esta autorización es separada de
            tus derechos de autor, que conservas completamente. Puedes publicar
            tu historia en otros lugares sin restricciones.
          </p>
        </section>

        {/* 4.5 Monetización y Enlaces de Afiliado */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-green-600" />
            4.5 Monetización y Enlaces de Afiliado
          </h2>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
              Transparencia sobre Monetización
            </h3>
            <ul className="text-green-800 dark:text-green-200 space-y-2 text-sm">
              <li>
                • <strong>Enlaces de afiliado:</strong> Letranido participa en
                programas de afiliados (Amazon, Udemy, Coursera, etc.)
              </li>
              <li>
                • <strong>Comisiones:</strong> Podemos recibir comisiones por
                compras realizadas a través de nuestros enlaces
              </li>
              <li>
                • <strong>Sin costo adicional:</strong> Los usuarios no pagan
                precios diferentes por usar nuestros enlaces
              </li>
              <li>
                • <strong>Identificación clara:</strong> Todos los enlaces de
                afiliado están claramente marcados con disclaimers
              </li>
              <li>
                • <strong>Recomendaciones honestas:</strong> Solo promocionamos
                productos/servicios que consideramos valiosos para escritores
              </li>
              <li>
                • <strong>Cumplimiento GDPR:</strong> El tracking de clicks
                respeta las preferencias de cookies del usuario
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4.5.1 Uso de Comisiones
          </h3>
          <p className="mb-4">
            Las comisiones recibidas se utilizan exclusivamente para:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Mantener la plataforma gratuita para todos los usuarios</li>
            <li>Mejorar la funcionalidad y experiencia de usuario</li>
            <li>Crear contenido educativo de calidad</li>
            <li>Organizar retos y eventos de la comunidad</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            4.5.2 Independencia Editorial
          </h3>
          <p className="mb-4">
            Nos comprometemos a mantener independencia editorial. Las comisiones
            de afiliado no influyen en nuestras reseñas, recomendaciones o
            contenido educativo.
          </p>
        </section>

        {/* 5. Comportamiento del Usuario */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2 text-green-600" />
            5. Comportamiento del Usuario
          </h2>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            5.1 Conducta Esperada
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Respeto hacia otros miembros de la comunidad</li>
            <li>Retroalimentación constructiva en comentarios</li>
            <li>Participación activa y positiva</li>
            <li>Reporte de contenido inapropiado</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            5.2 Conducta Prohibida
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Acoso, intimidación o bullying</li>
            <li>Spam o autopromoción excesiva</li>
            <li>Manipulación del sistema de votación</li>
            <li>Suplantación de identidad</li>
            <li>Compartir información personal de otros</li>
          </ul>
        </section>

        {/* 6. Moderación y Cumplimiento */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Moderación
          </h2>

          <p className="mb-4">
            Nos reservamos el derecho de moderar contenido y usuarios para
            mantener un ambiente seguro y positivo. Esto incluye:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Revisión de contenido reportado</li>
            <li>Remoción de contenido que viole estos términos</li>
            <li>Suspensión temporal o permanente de cuentas</li>
            <li>Cooperación con autoridades cuando sea legalmente requerido</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            6.1 Proceso de Apelación
          </h3>
          <p>
            Si crees que tu contenido fue removido incorrectamente, puedes
            apelar contactándonos en <strong><span className="break-all">legal@letranido.com</span></strong> dentro
            de 30 días.
          </p>
        </section>

        {/* 7. Limitación de Responsabilidad y DMCA */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Limitación de Responsabilidad y Protección Legal
          </h2>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <p className="text-gray-800 dark:text-gray-200 text-sm">
              <strong>AVISO LEGAL:</strong> Letranido se proporciona "como
              está". No nos hacemos responsables por daños directos, indirectos,
              incidentales o consecuentes que puedan surgir del uso de la
              plataforma.
            </p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            7.1 DMCA y Derechos de Autor
          </h3>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              <strong>IMPORTANTE:</strong> Si crees que tu contenido protegido
              por derechos de autor ha sido utilizado sin autorización, puedes
              enviar una notificación DMCA a
              <strong><span className="break-all">legal@letranido.com</span></strong> con la siguiente
              información:
            </p>
            <ul className="text-red-700 dark:text-red-200 text-sm mt-2 space-y-1 list-disc pl-4">
              <li>
                Identificación del material protegido por derechos de autor
              </li>
              <li>URL específica del contenido infractor</li>
              <li>Información de contacto del titular de derechos</li>
              <li>Declaración bajo juramento de buena fe</li>
              <li>Firma electrónica o física</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            7.2 Responsabilidad del Usuario
          </h3>
          <p className="mb-4">
            Los usuarios son completamente responsables de:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>La originalidad y legitimidad de su contenido</li>
            <li>Respetar los derechos de autor de terceros</li>
            <li>No infringir marcas registradas o patentes</li>
            <li>Cumplir con las leyes aplicables de su jurisdicción</li>
            <li>Respaldar su propio contenido</li>
            <li>
              <strong>
                Cualquier disputa por plagio, robo de ideas o contenido entre
                usuarios
              </strong>
            </li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              ⚠️ Riesgo de Publicación Pública
            </h4>
            <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-2">
              <strong>
                Al publicar en Letranido, reconoces y aceptas que:
              </strong>
            </p>
            <ul className="text-yellow-800 dark:text-yellow-200 text-sm space-y-1">
              <li>
                • Tu contenido será visible públicamente para todos los usuarios
              </li>
              <li>
                • <strong>Exists el riesgo</strong> de que otros usuarios puedan
                copiar, adaptar o usar tus ideas
              </li>
              <li>
                • <strong>Letranido NO es responsable</strong> por disputas de
                originalidad entre usuarios
              </li>
              <li>
                • <strong>Letranido NO puede prevenir</strong> el uso no
                autorizado de tu contenido por parte de otros usuarios
              </li>
              <li>
                • Es tu responsabilidad proteger tu propiedad intelectual y
                tomar acciones legales si es necesario
              </li>
              <li>• Publicas bajo tu propio riesgo y responsabilidad</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            7.3 Indemnización
          </h3>
          <p className="mb-4">
            Al usar Letranido, aceptas indemnizar y eximir de responsabilidad a
            la plataforma y sus operadores de cualquier reclamación, pérdida o
            daño resultante de:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Tu violación de estos términos</li>
            <li>Infracción de derechos de terceros</li>
            <li>Contenido que publiques o compartas</li>
            <li>Tu uso o mal uso de la plataforma</li>
            <li>
              <strong>
                Disputas con otros usuarios por alegado plagio, robo de ideas o
                contenido
              </strong>
            </li>
            <li>
              <strong>
                Uso no autorizado de tu contenido por parte de otros usuarios
              </strong>
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            7.4 Backup y Preservación de Contenido
          </h3>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
            <p className="text-orange-800 dark:text-orange-200 text-sm mb-2">
              <strong>⚠️ Responsabilidad del Usuario:</strong>
            </p>
            <ul className="text-orange-800 dark:text-orange-200 text-sm space-y-1">
              <li>
                • <strong>NO garantizamos</strong> la preservación permanente
                del contenido
              </li>
              <li>
                • <strong>Podemos eliminar contenido</strong> sin previo aviso
                por violaciones o mantenimiento
              </li>
              <li>
                • <strong>Es tu responsabilidad</strong> mantener copias de
                respaldo de tus historias
              </li>
              <li>
                • <strong>Problemas técnicos</strong> pueden resultar en pérdida
                de datos
              </li>
              <li>
                • <strong>No somos responsables</strong> por contenido perdido o
                eliminado
              </li>
            </ul>
          </div>
          <p>
            <strong>Recomendación:</strong> Guarda copias locales de todas tus
            historias antes de publicar.
          </p>
        </section>

        {/* 8. Limitación de Responsabilidad de Letranido */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-orange-600" />
            8. Limitación de Responsabilidad de Letranido
          </h2>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-3">
              🚫 Letranido NO es Responsable de Disputas Entre Usuarios
            </h3>
            <p className="text-red-800 dark:text-red-200 text-sm mb-3">
              <strong>
                Letranido es únicamente una plataforma de publicación. NO
                mediamos, resolvemos ni nos involucramos en disputas legales
                entre usuarios.
              </strong>
            </p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            8.1 Alcance de Nuestro Servicio
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
              <strong>Lo que SÍ hacemos:</strong>
            </p>
            <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
              <li>✅ Proporcionar la plataforma para publicar historias</li>
              <li>
                ✅ Eliminar contenido reportado como plagio (cuando proceda)
              </li>
              <li>✅ Suspender cuentas que violen nuestros términos</li>
              <li>✅ Mantener registros básicos requeridos por ley</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm mb-2">
              <strong>Lo que NO hacemos:</strong>
            </p>
            <ul className="text-red-800 dark:text-red-200 text-sm space-y-1">
              <li>❌ Mediar disputas entre usuarios</li>
              <li>❌ Investigar reclamos de plagio en profundidad</li>
              <li>❌ Proporcionar servicios legales</li>
              <li>❌ Garantizar que el contenido no será copiado</li>
              <li>❌ Participar en procesos judiciales entre usuarios</li>
              <li>❌ Compensar por pérdidas o daños</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            8.2 Disputas Entre Usuarios
          </h3>
          <p className="mb-4">
            Si tienes un conflicto con otro usuario (plagio, robo de ideas,
            etc.):
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Resuélvelo directamente:</strong> Entre tú y el otro
              usuario
            </li>
            <li>
              <strong>Busca asesoría legal propia:</strong> Si es necesario
            </li>
            <li>
              <strong>Usa los canales legales apropiados:</strong> Tribunales,
              abogados, etc.
            </li>
            <li>
              <strong>Letranido permanece neutral:</strong> No tomamos partido
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            8.3 Eliminación de Contenido
          </h3>
          <p className="mb-4">
            Nuestro único rol en disputas es evaluar si eliminar contenido:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Evaluamos reportes caso por caso</li>
            <li>Eliminamos contenido obviamente plagiado</li>
            <li>En casos dudosos, podemos eliminar preventivamente</li>
            <li>Nuestra decisión es administrativa, no legal</li>
            <li>No constituye una determinación legal de derechos</li>
          </ul>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-gray-800 dark:text-gray-200 text-sm">
              <strong>💡 Recuerda:</strong> Al usar Letranido, aceptas que eres
              completamente responsable de tus propios asuntos legales y
              disputas. Publicas bajo tu propio riesgo.
            </p>
          </div>
        </section>

        {/* 9. Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            9. Contacto
          </h2>

          <p>Para preguntas sobre estos términos, contacta:</p>
          <div className="bg-blue-50 dark:bg-blue-800/20 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Email:</strong> <span className="break-all">legal@letranido.com</span>
              <br />
              <strong>Respuesta:</strong> Dentro de 5 días hábiles
              <br />
              <strong>Nota:</strong> Solo para consultas sobre términos de
              servicio, no para disputas entre usuarios
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Al continuar usando Letranido, confirmas que has leído, entendido y
            aceptado estos términos de servicio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
