// pages/TermsOfService.jsx - TÉRMINOS COMPLETOS
import { Shield, FileText, Users, Trophy, AlertTriangle } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
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
            apelar contactándonos en [email de contacto] dentro de 30 días.
          </p>
        </section>

        {/* 7. Limitación de Responsabilidad */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Limitación de Responsabilidad
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-800 text-sm">
              <strong>AVISO LEGAL:</strong> Letranido se proporciona "como
              está". No nos hacemos responsables por daños directos, indirectos,
              incidentales o consecuentes que puedan surgir del uso de la
              plataforma.
            </p>
          </div>

          <p>
            Los usuarios son responsables de respaldar su propio contenido. No
            garantizamos la preservación permanente del contenido en la
            plataforma.
          </p>
        </section>

        {/* 8. Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contacto</h2>

          <p>Para preguntas sobre estos términos, contacta:</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800">
              <strong>Email:</strong> cristianccggg@gmail.com
              <br />
              <strong>Respuesta:</strong> Dentro de 5 días hábiles
              <br />
              <strong>Jurisdicción:</strong> Colombia
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
