// pages/PrivacyPolicy.jsx - POLÍTICA DE PRIVACIDAD
import { Shield, Eye, Database, Mail, Lock, AlertTriangle } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="prose prose-gray max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <p className="text-xl text-gray-600">
            Cómo protegemos y manejamos tu información en Letranido
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: {new Date().toLocaleDateString("es-ES")}
          </p>
        </div>

        {/* Resumen Ejecutivo */}
        <section className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-2" />
              Resumen: Tu privacidad es nuestra prioridad
            </h2>
            <ul className="text-green-800 space-y-2">
              <li>
                ✅ <strong>Mínima recopilación:</strong> Solo email, nombre de
                usuario y contenido que publicas
              </li>
              <li>
                ✅ <strong>No vendemos datos:</strong> Nunca compartimos tu
                información con terceros para marketing
              </li>
              <li>
                ✅ <strong>Tú controlas tu contenido:</strong> Puedes eliminar
                tus historias cuando quieras
              </li>
              <li>
                ✅ <strong>Sin tracking invasivo:</strong> No usamos cookies de
                seguimiento publicitario
              </li>
              <li>
                ✅ <strong>Transparencia total:</strong> Sabemos exactamente qué
                datos tenemos y por qué
              </li>
            </ul>
          </div>
        </section>

        {/* 1. Información que Recopilamos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Database className="h-6 w-6 mr-2 text-blue-600" />
            1. Información que Recopilamos
          </h2>

          <h3 className="text-lg font-semibold mb-2">
            1.1 Información de Cuenta
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Email:</strong> Para autenticación y comunicaciones
              importantes
            </li>
            <li>
              <strong>Nombre de usuario:</strong> Para identificarte en la
              plataforma
            </li>
            <li>
              <strong>Contraseña:</strong> Encriptada, nunca almacenamos texto
              plano
            </li>
            <li>
              <strong>Fecha de registro:</strong> Para estadísticas internas
            </li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">1.2 Contenido Creado</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Historias:</strong> Texto completo de tus participaciones
            </li>
            <li>
              <strong>Votos:</strong> Qué historias has marcado como favoritas
            </li>
            <li>
              <strong>Comentarios:</strong> Retroalimentación que dejas en
              historias
            </li>
            <li>
              <strong>Metadatos:</strong> Fechas de creación, conteo de palabras
            </li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">1.3 Consentimientos Legales</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 mb-2">
              <strong>Para protección legal, almacenamos tus consentimientos al enviar historias:</strong>
            </p>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Confirmación de originalidad del contenido</li>
              <li>• Aceptación de no uso de Inteligencia Artificial</li>
              <li>• Autorización para compartir contenido ganador (opcional)</li>
              <li>• Marcado de contenido maduro cuando corresponda</li>
              <li>• Aceptación de términos y condiciones</li>
              <li>• Marca de tiempo y información técnica básica (navegador)</li>
            </ul>
            <p className="text-blue-700 text-sm mt-2">
              <strong>Propósito:</strong> Estos registros nos protegen legalmente a ambos en caso de disputas de derechos de autor o reclamaciones.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-2">
            1.4 Información Técnica Mínima
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Dirección IP:</strong> Solo para prevenir spam y abuso
            </li>
            <li>
              <strong>Tipo de navegador:</strong> Para optimizar la experiencia
            </li>
            <li>
              <strong>Timestamps:</strong> Cuándo accedes a la plataforma
            </li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 text-sm">
              <strong>NO recopilamos:</strong> Ubicación precisa, datos de
              dispositivo personal, historial de navegación fuera de Letranido,
              información de redes sociales, datos biométricos, o información
              financiera.
            </p>
          </div>
        </section>

        {/* 2. Cómo Usamos tu Información */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Eye className="h-6 w-6 mr-2 text-green-600" />
            2. Cómo Usamos tu Información
          </h2>

          <h3 className="text-lg font-semibold mb-2">
            2.1 Operación de la Plataforma
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Permitir login y acceso a tu cuenta</li>
            <li>Mostrar tu contenido en la plataforma</li>
            <li>Facilitar votación y participación en concursos</li>
            <li>Prevenir spam, fraude y comportamiento abusivo</li>
            <li>Generar estadísticas agregadas y anónimas</li>
            <li>Mantener registros de consentimientos legales para protección jurídica</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">2.2 Comunicaciones</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Esenciales:</strong> Confirmación de cuenta, cambios en
              términos
            </li>
            <li>
              <strong>Opcionales:</strong> Notificaciones de concursos (puedes
              desactivar)
            </li>
            <li>
              <strong>Nunca:</strong> Marketing de terceros, spam comercial
            </li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Importante:</strong> Nunca usamos tu contenido para
              entrenar modelos de IA, ni lo licenciamos a terceros sin tu
              consentimiento explícito.
            </p>
          </div>
        </section>

        {/* 3. Compartir Información */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Lock className="h-6 w-6 mr-2 text-red-600" />
            3. Cuándo Compartimos tu Información
          </h2>

          <h3 className="text-lg font-semibold mb-2 text-green-700">
            3.1 Públicamente (por tu elección)
          </h3>
          <ul className="list-disc pl-6 mb-4 text-green-800">
            <li>
              Tu nombre de usuario y historias son visibles para otros usuarios
            </li>
            <li>
              Estadísticas de participación (número de historias, votos
              recibidos)
            </li>
            <li>Fecha de unión a la plataforma</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2 text-red-700">
            3.2 NUNCA Compartimos
          </h3>
          <ul className="list-disc pl-6 mb-4 text-red-800">
            <li>Tu dirección de email</li>
            <li>Tu IP o información técnica</li>
            <li>Historias en borrador o privadas</li>
            <li>Datos para marketing o publicidad</li>
            <li>Información personal identificable</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">
            3.3 Excepciones Legales
          </h3>
          <p className="mb-4">Solo compartimos información si:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Es requerido por orden judicial válida</li>
            <li>Para prevenir daño físico inmediato</li>
            <li>Para proteger nuestros derechos legales</li>
            <li>
              En caso de transferencia de negocio (con notificación previa)
            </li>
          </ul>
        </section>

        {/* 4. Seguridad de Datos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Seguridad de tus Datos
          </h2>

          <h3 className="text-lg font-semibold mb-2">4.1 Medidas Técnicas</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Encriptación:</strong> Todas las comunicaciones usan
              HTTPS/TLS
            </li>
            <li>
              <strong>Contraseñas:</strong> Hasheadas con algoritmos seguros
              (bcrypt)
            </li>
            <li>
              <strong>Base de datos:</strong> Acceso restringido y monitoreo
            </li>
            <li>
              <strong>Backups:</strong> Encriptados y almacenados de forma
              segura
            </li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">
            4.2 Medidas Administrativas
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Acceso a datos limitado a personal esencial</li>
            <li>Auditorías regulares de seguridad</li>
            <li>Políticas estrictas de manejo de datos</li>
            <li>Capacitación en privacidad para el equipo</li>
          </ul>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              <strong>⚠️ Limitaciones:</strong> Ningún sistema es 100% seguro.
              Te notificaremos inmediatamente en caso de cualquier brecha de
              seguridad.
            </p>
          </div>
        </section>

        {/* 5. Tus Derechos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. Tus Derechos sobre tus Datos
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                ✅ Derechos que tienes:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Acceder a todos tus datos</li>
                <li>• Corregir información incorrecta</li>
                <li>• Eliminar tu cuenta completamente</li>
                <li>• Exportar tus historias</li>
                <li>• Desactivar notificaciones</li>
                <li>• Solicitar información sobre uso</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                📞 Cómo ejercer tus derechos:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Configuración de cuenta</li>
                <li>• Email: privacy@literalab.com</li>
                <li>• Respuesta: 30 días máximo</li>
                <li>• Sin costo para ti</li>
                <li>• Proceso simple y rápido</li>
              </ul>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">
            5.1 Eliminación de Cuenta
          </h3>
          <p className="mb-4">Si eliminas tu cuenta:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Se elimina inmediatamente:</strong> Email, nombre,
              configuraciones
            </li>
            <li>
              <strong>Se anonimiza:</strong> Historias publicadas (para
              preservar concursos)
            </li>
            <li>
              <strong>Se elimina completamente:</strong> Borradores, votos,
              comentarios
            </li>
            <li>
              <strong>Irreversible:</strong> No podemos recuperar datos
              eliminados
            </li>
          </ul>
        </section>

        {/* 6. Cookies y Tracking */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Cookies y Tracking
          </h2>

          <h3 className="text-lg font-semibold mb-2">
            6.1 Cookies Esenciales (No puedes desactivar)
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Sesión de login:</strong> Para mantenerte conectado
            </li>
            <li>
              <strong>Preferencias básicas:</strong> Idioma, tema
            </li>
            <li>
              <strong>Seguridad:</strong> Prevención de CSRF y ataques
            </li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">6.2 NO Usamos</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>❌ Cookies de publicidad</li>
            <li>
              ❌ Tracking de terceros (Google Analytics, Facebook Pixel, etc.)
            </li>
            <li>❌ Fingerprinting del dispositivo</li>
            <li>❌ Cookies de redes sociales</li>
          </ul>
        </section>

        {/* 7. Menores de Edad */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
            7. Protección de Menores
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-900 mb-2">
              Política para menores de 13 años
            </h3>
            <p className="text-orange-800 text-sm">
              No recopilamos intencionalmente información de menores de 13 años.
              Si descubrimos que tenemos datos de un menor de 13, los
              eliminaremos inmediatamente.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-2">
            7.1 Usuarios de 13-17 años
          </h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Requieren supervisión parental</li>
            <li>Misma protección de privacidad que adultos</li>
            <li>Contenido moderado más estrictamente</li>
            <li>Padres pueden solicitar eliminación de cuenta</li>
          </ul>
        </section>

        {/* 8. Cambios a esta Política */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. Cambios a esta Política
          </h2>

          <p className="mb-4">
            Podemos actualizar esta política ocasionalmente. Cuando lo hagamos:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Te notificaremos por email 30 días antes</li>
            <li>Publicaremos los cambios en la plataforma</li>
            <li>Mantendremos historial de versiones</li>
            <li>Cambios sustanciales requerirán tu consentimiento</li>
          </ul>
        </section>

        {/* 9. Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Mail className="h-6 w-6 mr-2 text-blue-600" />
            9. Contacto sobre Privacidad
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4">
              ¿Preguntas sobre tu privacidad?
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                <strong>Email principal:</strong> info@letranido.com
              </p>
              <p>
                <strong>Asunto sugerido:</strong> "Consulta de Privacidad - [Tu
                consulta]"
              </p>
              <p>
                <strong>Tiempo de respuesta:</strong> 3-5 días hábiles
              </p>
              <p>
                <strong>Idiomas:</strong> Español, Inglés
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-300">
              <p className="text-blue-700 text-sm">
                <strong>Para solicitudes de datos:</strong> Incluye tu email de
                registro y una descripción específica de lo que necesitas.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Tu privacidad, nuestra responsabilidad
            </h3>
            <p className="text-gray-600 text-sm">
              Estamos comprometidos con proteger tu información personal y darte
              control total sobre tus datos. Si algo no está claro, no dudes en
              contactarnos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
