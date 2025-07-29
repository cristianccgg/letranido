// pages/TermsOfService.jsx - TÉRMINOS COMPLETOS
import { Shield, FileText, Users, Trophy, AlertTriangle } from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Términos de Servicio"
        description="Lee los términos de servicio de Letranido. Conoce las reglas sobre originalidad, derechos de autor, concursos y el comportamiento esperado en nuestra comunidad de escritores."
        keywords="términos de servicio, reglas, derechos de autor, originalidad, concursos escritura, comunidad escritores, letranido"
        url="/terms"
      />
      
      <div className="prose prose-gray max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Términos de Servicio
          </h1>
          <p className="text-xl text-gray-600">
            Letranido - Comunidad de Escritura Creativa
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: {new Date().toLocaleDateString("es-ES")}
          </p>
        </div>

        {/* 1. Aceptación de Términos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            1. Aceptación de Términos
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800">
              Al acceder y usar Letranido, aceptas cumplir estos términos de
              servicio. Si no estás de acuerdo, por favor no uses la plataforma.
            </p>
          </div>
          <p>
            Estos términos constituyen un acuerdo legal entre tú ("Usuario") y
            Letranido ("Nosotros", "Plataforma"). Nos reservamos el derecho de
            modificar estos términos en cualquier momento, con notificación
            previa de al menos 30 días.
          </p>
        </section>

        {/* 2. Derechos de Autor y Contenido Original */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-600" />
            2. Derechos de Autor y Contenido Original
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-red-900 mb-2">
              IMPORTANTE - Originalidad Absoluta Requerida
            </h3>
            <ul className="text-red-800 text-sm space-y-1">
              <li>✅ Tu contenido debe ser 100% original y de tu autoría</li>
              <li>
                ❌ Prohibido copiar, parafrasear o adaptar obras existentes
              </li>
              <li>
                ❌ Prohibido uso de Inteligencia Artificial para generar
                contenido
              </li>
              <li>
                ❌ Prohibido contenido basado en universos con derechos de autor
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">
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

          <h3 className="text-lg font-semibold mb-2">2.2 Prohibición de IA</h3>
          <p className="mb-4">
            <strong>
              Estrictamente prohibido el uso de herramientas de IA
            </strong>{" "}
            como:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              ChatGPT, Claude, GPT-4, Bard, o cualquier modelo de lenguaje
            </li>
            <li>Herramientas de escritura asistida por IA</li>
            <li>Generadores de contenido automático</li>
            <li>Parafraseo asistido por IA de contenido existente</li>
          </ul>
          <p>
            <em>
              Nota: Puedes usar correctores ortográficos (Grammarly, etc.) para
              revisión.
            </em>
          </p>

          <h3 className="text-lg font-semibold mb-2">
            2.3 Verificación y Consecuencias
          </h3>
          <p>
            Nos reservamos el derecho de verificar la originalidad del
            contenido. Las violaciones pueden resultar en:
          </p>
          <ul className="list-disc pl-6">
            <li>Descalificación inmediata del concurso</li>
            <li>Suspensión temporal o permanente de la cuenta</li>
            <li>Reporte a autoridades competentes en casos graves</li>
          </ul>
        </section>

        {/* 3. Contenido Permitido y Prohibido */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-yellow-600" />
            3. Contenido Permitido y Prohibido
          </h2>

          <h3 className="text-lg font-semibold mb-2 text-green-700">
            3.1 Contenido Permitido
          </h3>
          <ul className="list-disc pl-6 mb-4 text-green-800">
            <li>Ficción original en todos los géneros</li>
            <li>
              Contenido maduro apropiadamente marcado (violencia moderada, temas
              adultos)
            </li>
            <li>Crítica social constructiva</li>
            <li>Exploración de temas complejos con sensibilidad</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2 text-red-700">
            3.2 Contenido Estrictamente Prohibido
          </h3>
          <ul className="list-disc pl-6 mb-4 text-red-800">
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

        {/* 4. Concursos y Votación */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-600" />
            4. Reglas de Concursos
          </h2>

          <h3 className="text-lg font-semibold mb-2">4.1 Elegibilidad</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              Usuarios mayores de 13 años (menores requieren supervisión
              parental)
            </li>
            <li>Una participación por persona por concurso</li>
            <li>Cumplimiento de límites de palabras establecidos</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">
            4.2 Sistema de Votación
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Votación abierta para todos los usuarios registrados</li>
            <li>Un voto (like) por historia por usuario</li>
            <li>Prohibido votar por tu propia historia</li>
            <li>Prohibidas cuentas múltiples para votación</li>
            <li>Detección automática de comportamiento sospechoso</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">
            4.3 Premios y Reconocimientos
          </h3>
          <p className="mb-4">
            Los premios son principalmente reconocimientos virtuales (insignias,
            destacados). Cualquier premio físico será claramente especificado.
            No hay transferencia monetaria de premios virtuales.
          </p>

          <h3 className="text-lg font-semibold mb-2">
            4.4 Uso de Contenido Ganador para Promoción
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 mb-3">
              <strong>Al ganar un concurso y autorizar el uso promocional:</strong>
            </p>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>
                • <strong>Otorgas permiso</strong> para que Letranido use tu historia ganadora, nombre de usuario y fragmentos seleccionados con fines promocionales
              </li>
              <li>
                • <strong>Incluye uso en:</strong> Redes sociales, página web, newsletters, comunicados de prensa y material promocional
              </li>
              <li>
                • <strong>Siempre con crédito:</strong> Tu nombre de usuario será incluido en toda promoción
              </li>
              <li>
                • <strong>Sin compensación adicional:</strong> Esta autorización es parte del reconocimiento como ganador
              </li>
              <li>
                • <strong>Uso limitado:</strong> Solo para promoción de Letranido y reconocimiento del concurso, no para uso comercial independiente
              </li>
            </ul>
          </div>
          
          <p className="mb-4 text-sm text-gray-700">
            <strong>Nota importante:</strong> Esta autorización es separada de tus derechos de autor, que conservas completamente. 
            Puedes publicar tu historia en otros lugares sin restricciones.
          </p>
        </section>

        {/* 5. Comportamiento del Usuario */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2 text-green-600" />
            5. Comportamiento del Usuario
          </h2>

          <h3 className="text-lg font-semibold mb-2">5.1 Conducta Esperada</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Respeto hacia otros miembros de la comunidad</li>
            <li>Retroalimentación constructiva en comentarios</li>
            <li>Participación activa y positiva</li>
            <li>Reporte de contenido inapropiado</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">5.2 Conducta Prohibida</h3>
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

          <h3 className="text-lg font-semibold mb-2">
            6.1 Proceso de Apelación
          </h3>
          <p>
            Si crees que tu contenido fue removido incorrectamente, puedes
            apelar contactándonos en <strong>legal@letranido.com</strong> dentro de 30 días.
          </p>
        </section>

        {/* 7. Limitación de Responsabilidad y DMCA */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Limitación de Responsabilidad y Protección Legal
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-800 text-sm">
              <strong>AVISO LEGAL:</strong> Letranido se proporciona "como
              está". No nos hacemos responsables por daños directos, indirectos,
              incidentales o consecuentes que puedan surgir del uso de la
              plataforma.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-2">7.1 DMCA y Derechos de Autor</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">
              <strong>IMPORTANTE:</strong> Si crees que tu contenido protegido por derechos de autor 
              ha sido utilizado sin autorización, puedes enviar una notificación DMCA a 
              <strong> legal@letranido.com</strong> con la siguiente información:
            </p>
            <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc pl-4">
              <li>Identificación del material protegido por derechos de autor</li>
              <li>URL específica del contenido infractor</li>
              <li>Información de contacto del titular de derechos</li>
              <li>Declaración bajo juramento de buena fe</li>
              <li>Firma electrónica o física</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">7.2 Responsabilidad del Usuario</h3>
          <p className="mb-4">
            Los usuarios son completamente responsables de:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>La originalidad y legitimidad de su contenido</li>
            <li>Respetar los derechos de autor de terceros</li>
            <li>No infringir marcas registradas o patentes</li>
            <li>Cumplir con las leyes aplicables de su jurisdicción</li>
            <li>Respaldar su propio contenido</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">7.3 Indemnización</h3>
          <p className="mb-4">
            Al usar Letranido, aceptas indemnizar y eximir de responsabilidad 
            a la plataforma y sus operadores de cualquier reclamación, pérdida 
            o daño resultante de:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Tu violación de estos términos</li>
            <li>Infracción de derechos de terceros</li>
            <li>Contenido que publiques o compartas</li>
            <li>Tu uso o mal uso de la plataforma</li>
          </ul>

          <p>
            No garantizamos la preservación permanente del contenido en la
            plataforma. Es responsabilidad del usuario mantener copias de respaldo.
          </p>
        </section>

        {/* 8. Resolución de Disputas y Arbitraje */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-orange-600" />
            8. Resolución de Disputas y Arbitraje
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-orange-900 mb-3">
              ⚖️ Acuerdo de Arbitraje Vinculante
            </h3>
            <p className="text-orange-800 text-sm mb-3">
              <strong>Al usar Letranido, aceptas que cualquier disputa legal será resuelta mediante arbitraje, 
              no en los tribunales ordinarios.</strong> Este acuerdo es vinculante y afecta tus derechos legales.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-2">8.1 Disputas Cubiertas</h3>
          <p className="mb-4">
            Este acuerdo de arbitraje cubre <strong>todas las disputas</strong> relacionadas con:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>El uso de la plataforma Letranido</li>
            <li>Violaciones de estos términos de servicio</li>
            <li>Disputas de derechos de autor o propiedad intelectual</li>
            <li>Reclamaciones por daños o pérdidas</li>
            <li>Cuestiones de privacidad o protección de datos</li>
            <li>Suspensión o eliminación de cuentas</li>
            <li>Cualquier controversia contractual o extracontractual</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">8.2 Proceso de Arbitraje</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <ul className="space-y-2 text-sm">
              <li><strong>Sede:</strong> Bogotá, Colombia</li>
              <li><strong>Reglas:</strong> Centro de Arbitraje y Conciliación de la Cámara de Comercio de Bogotá</li>
              <li><strong>Idioma:</strong> Español</li>
              <li><strong>Ley aplicable:</strong> Legislación colombiana</li>
              <li><strong>Número de árbitros:</strong> 1 árbitro para disputas menores a $10,000 USD; 3 árbitros para disputas mayores</li>
              <li><strong>Procedimiento:</strong> Escrito, con audiencia oral opcional a solicitud de cualquier parte</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">8.3 Costos del Arbitraje</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Costos administrativos:</strong> Compartidos al 50% entre las partes</li>
            <li><strong>Honorarios del árbitro:</strong> Compartidos al 50% entre las partes</li>
            <li><strong>Costos legales:</strong> Cada parte paga sus propios abogados</li>
            <li><strong>Excepción:</strong> Si el árbitro determina que una reclamación fue frívola o de mala fe, 
            la parte perdedora pagará todos los costos</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">8.4 Limitaciones Importantes</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-900 mb-2">🚫 Renuncia a Derechos</h4>
            <ul className="text-red-800 text-sm space-y-1">
              <li>• <strong>No jurado:</strong> Renuncias al derecho a un juicio por jurado</li>
              <li>• <strong>No tribunal:</strong> Renuncias al derecho a litigar en tribunales ordinarios</li>
              <li>• <strong>No demandas colectivas:</strong> Renuncias al derecho a participar en demandas colectivas o class actions</li>
              <li>• <strong>No representación de grupo:</strong> Cada disputa debe ser individual</li>
              <li>• <strong>Confidencialidad:</strong> El proceso de arbitraje es confidencial</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">8.5 Excepciones al Arbitraje</h3>
          <p className="mb-4">
            Las siguientes disputas <strong>NO</strong> están sujetas a arbitraje y pueden resolverse en tribunales ordinarios:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Reclamaciones en tribunales de menor cuantía (cuando sea aplicable)</li>
            <li>Solicitudes de medidas cautelares urgentes para prevenir daño irreparable</li>
            <li>Disputas sobre propiedad intelectual que requieran medidas inmediatas</li>
            <li>Investigaciones gubernamentales o procedimientos regulatorios</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">8.6 Período de Limitación</h3>
          <p className="mb-4">
            <strong>Cualquier disputa debe iniciarse dentro de UN (1) AÑO</strong> después de que surja la causa de acción. 
            Después de ese período, la reclamación estará permanentemente excluida.
          </p>

          <h3 className="text-lg font-semibold mb-2">8.7 Separabilidad</h3>
          <p className="mb-4">
            Si cualquier parte de esta cláusula de arbitraje se considera inválida o inaplicable, 
            el resto permanecerá en vigor. Si la renuncia a demandas colectivas se considera inválida, 
            toda la cláusula de arbitraje será nula.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>💡 Consejo:</strong> Si no estás de acuerdo con esta cláusula de arbitraje, 
              no uses Letranido. Al continuar usando la plataforma, confirmas tu aceptación 
              de resolver disputas mediante arbitraje.
            </p>
          </div>
        </section>

        {/* 9. Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contacto</h2>

          <p>Para preguntas sobre estos términos, contacta:</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800">
              <strong>Email:</strong> legal@letranido.com
              <br />
              <strong>Respuesta:</strong> Dentro de 5 días hábiles
              <br />
              <strong>Jurisdicción:</strong> Bogotá, Colombia
              <br />
              <strong>Ley aplicable:</strong> Legislación colombiana
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-12 text-center">
          <p className="text-gray-600">
            Al continuar usando Letranido, confirmas que has leído, entendido y
            aceptado estos términos de servicio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
