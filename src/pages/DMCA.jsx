// pages/DMCA.jsx - POLÍTICA DMCA DETALLADA
import { AlertTriangle, FileText, Mail, Shield, Clock } from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";

const DMCA = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Política DMCA - Reporte de Infracciones de Derechos de Autor"
        description="Información completa sobre cómo reportar infracciones de derechos de autor en Letranido. Proceso DMCA, contacto y procedimientos legales."
        keywords="dmca, derechos de autor, infracción, reporte, letranido, copyright, plagio"
        url="/dmca"
      />
      
      <div className="prose prose-gray max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política DMCA
          </h1>
          <p className="text-xl text-gray-600">
            Protección de Derechos de Autor en Letranido
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: {new Date().toLocaleDateString("es-ES")}
          </p>
        </div>

        {/* Aviso Importante */}
        <section className="mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              ⚠️ AVISO IMPORTANTE
            </h2>
            <ul className="text-red-800 space-y-2">
              <li>
                🚨 <strong>Solo contenido original:</strong> Letranido es una plataforma exclusivamente para contenido original
              </li>
              <li>
                ⚖️ <strong>Tolerancia cero al plagio:</strong> Cualquier infracción resulta en eliminación inmediata
              </li>
              <li>
                📧 <strong>Reportes legítimos solamente:</strong> Reportes falsos pueden tener consecuencias legales
              </li>
              <li>
                🔒 <strong>Protección automática:</strong> Todo contenido está protegido por derechos de autor desde su creación
              </li>
            </ul>
          </div>
        </section>

        {/* 1. Compromiso con la Originalidad */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            1. Nuestro Compromiso con la Originalidad
          </h2>

          <p className="mb-4">
            Letranido respeta los derechos de autor y exige que todo el contenido sea 100% original. 
            Cumplimos con la Digital Millennium Copyright Act (DMCA) y las leyes colombianas de derechos de autor.
          </p>

          <h3 className="text-lg font-semibold mb-2">1.1 Lo que Protegemos</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Contenido textual:</strong> Historias, poemas, relatos</li>
            <li><strong>Ideas expresadas:</strong> Tramas, personajes, diálogos originales</li>
            <li><strong>Estilo narrativo:</strong> Estructura y forma de expresión únicos</li>
            <li><strong>Títulos creativos:</strong> Cuando demuestran originalidad</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">1.2 Lo que NO Toleramos</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>❌ Copia directa de textos existentes</li>
            <li>❌ Parafraseo de obras protegidas</li>
            <li>❌ Traducción no autorizada</li>
            <li>❌ Adaptación de obras existentes sin permiso</li>
            <li>❌ Fan fiction de universos protegidos</li>
            <li>❌ Contenido generado por IA basado en obras existentes</li>
          </ul>
        </section>

        {/* 2. Cómo Reportar Infracciones */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-red-600" />
            2. Cómo Reportar una Infracción
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4">
              📧 Información de Contacto DMCA
            </h3>
            <div className="text-blue-800 space-y-2">
              <p><strong>Email:</strong> dmca@letranido.com</p>
              <p><strong>Asunto requerido:</strong> "DMCA Takedown Notice - [Título de la obra]"</p>
              <p><strong>Respuesta garantizada en:</strong> 24-48 horas</p>
              <p><strong>Idiomas aceptados:</strong> Español, Inglés</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">2.1 Información Requerida en tu Reporte</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="font-semibold mb-3">Para procesar tu reporte DMCA, incluye:</p>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li><strong>Tu información de contacto completa:</strong> Nombre completo, dirección, teléfono, email</li>
              <li><strong>Identificación de tu obra protegida:</strong> Título, fecha de creación, evidencia de autoría</li>
              <li><strong>URL específica del contenido infractor:</strong> Link directo a la historia en Letranido</li>
              <li><strong>Declaración de buena fe:</strong> "Tengo la creencia de buena fe de que el uso no está autorizado"</li>
              <li><strong>Declaración de veracidad:</strong> "La información en esta notificación es exacta"</li>
              <li><strong>Autorización:</strong> "Estoy autorizado para actuar en nombre del titular de los derechos"</li>
              <li><strong>Firma:</strong> Firma electrónica o física</li>
            </ol>
          </div>

          <h3 className="text-lg font-semibold mb-2">2.2 Evidencia Recomendada</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>📄 Documento original con fecha</li>
            <li>📚 Registro de derechos de autor (si aplica)</li>
            <li>🌐 Enlaces a publicación original</li>
            <li>📸 Screenshots comparativos</li>
            <li>⏰ Evidencia de fechas de publicación</li>
          </ul>
        </section>

        {/* 3. Nuestro Proceso de Respuesta */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-green-600" />
            3. Nuestro Proceso de Respuesta
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">🚨 Paso 1: Evaluación Inmediata</h4>
              <p className="text-red-800 text-sm">
                <strong>0-24 horas:</strong> Revisión inicial del reporte. Si es claramente válido, 
                removemos el contenido preventivamente.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">🔍 Paso 2: Investigación</h4>
              <p className="text-yellow-800 text-sm">
                <strong>24-72 horas:</strong> Verificamos la legitimidad del reclamo, 
                contactamos al usuario reportado para dar oportunidad de respuesta.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✅ Paso 3: Resolución</h4>
              <p className="text-green-800 text-sm">
                <strong>72-120 horas:</strong> Decisión final. Notificamos a ambas partes 
                del resultado y las acciones tomadas.
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">3.1 Posibles Acciones</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Remoción inmediata:</strong> Si la infracción es clara</li>
            <li><strong>Suspensión de cuenta:</strong> Para infractores reincidentes</li>
            <li><strong>Eliminación permanente:</strong> Para violaciones graves</li>
            <li><strong>Reporte a autoridades:</strong> En casos de fraude comercial</li>
            <li><strong>Desestimación del reclamo:</strong> Si no tiene fundamento</li>
          </ul>
        </section>

        {/* 4. Contranotificación */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Proceso de Contranotificación
          </h2>

          <p className="mb-4">
            Si crees que tu contenido fue removido incorrectamente, puedes enviar una contranotificación:
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-orange-900 mb-2">📋 Información Requerida:</h4>
            <ol className="list-decimal pl-6 text-orange-800 text-sm space-y-1">
              <li>Tu información de contacto completa</li>
              <li>Identificación del contenido removido</li>
              <li>Declaración bajo pena de perjurio de que el contenido es original</li>
              <li>Consentimiento a la jurisdicción del tribunal de Bogotá, Colombia</li>
              <li>Tu firma física o electrónica</li>
            </ol>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            <strong>Tiempo límite:</strong> 14 días desde la notificación de remoción.<br/>
            <strong>Proceso:</strong> Enviamos tu contranotificación al denunciante original. 
            Si no inician acción legal en 10-14 días, podemos restaurar el contenido.
          </p>
        </section>

        {/* 5. Prevención */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. Cómo Evitar Problemas de Derechos de Autor
          </h2>

          <h3 className="text-lg font-semibold mb-2 text-green-700">✅ Buenas Prácticas</h3>
          <ul className="list-disc pl-6 mb-4 text-green-800">
            <li>Escribe solo contenido 100% original de tu creatividad</li>
            <li>Documenta tu proceso creativo (borradores, fechas)</li>
            <li>Evita referencias específicas a obras protegidas</li>
            <li>Si te inspiras, transforma completamente la idea</li>
            <li>Cuando tengas dudas, consulta antes de publicar</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2 text-red-700">❌ Qué Evitar</h3>
          <ul className="list-disc pl-6 mb-4 text-red-800">
            <li>Copiar y pegar texto de cualquier fuente</li>
            <li>Parafrasear cambiando solo algunas palabras</li>
            <li>Traducir obras sin autorización</li>
            <li>Usar personajes de universos protegidos</li>
            <li>Adaptar tramas reconocibles</li>
          </ul>
        </section>

        {/* 6. Información Legal */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Información Legal
          </h2>

          <h3 className="text-lg font-semibold mb-2">6.1 Legislación Aplicable</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Colombia:</strong> Ley 23 de 1982, Ley 44 de 1993</li>
            <li><strong>Internacional:</strong> Convención de Berna</li>
            <li><strong>Digital:</strong> DMCA (aplicable por hosting en servicios internacionales)</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">6.2 Consecuencias Legales</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm mb-2">
              <strong>⚠️ Las infracciones de derechos de autor pueden resultar en:</strong>
            </p>
            <ul className="text-red-700 text-sm space-y-1 list-disc pl-4">
              <li>Demandas civiles por daños y perjuicios</li>
              <li>Acciones penales en casos graves</li>
              <li>Multas económicas significativas</li>
              <li>Prohibición de usar plataformas digitales</li>
              <li>Antecedentes legales permanentes</li>
            </ul>
          </div>
        </section>

        {/* Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="h-6 w-6 mr-2 text-blue-600" />
            7. Contacto DMCA
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4">
              📧 Agente Designado DMCA
            </h3>
            <div className="text-blue-800 space-y-2">
              <p><strong>Nombre:</strong> Agente Legal Letranido</p>
              <p><strong>Email:</strong> dmca@letranido.com</p>
              <p><strong>Dirección:</strong> Bogotá, Colombia</p>
              <p><strong>Horario de atención:</strong> 24/7 para reportes urgentes</p>
              
              <div className="mt-4 pt-4 border-t border-blue-300">
                <p className="text-blue-700 text-sm">
                  <strong>Para consultas generales:</strong> info@letranido.com<br/>
                  <strong>Para asuntos legales únicamente:</strong> dmca@letranido.com
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Protección Legal Mutua
            </h3>
            <p className="text-gray-600 text-sm">
              Esta política protege tanto a creadores como a usuarios. Reporta solo violaciones legítimas 
              y respeta el trabajo creativo de otros. Juntos mantenemos Letranido como un espacio seguro para la creatividad original.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMCA;