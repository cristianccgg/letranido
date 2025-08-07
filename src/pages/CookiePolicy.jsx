import React from "react";
import {
  Cookie,
  Shield,
  Settings,
  Database,
  AlertTriangle,
  Check,
} from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 dark:bg-gray-900 min-h-screen">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Cookie className="h-10 w-10 text-primary-600" />
            Política de Cookies
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Información detallada sobre el uso de cookies en Letranido
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Última actualización: {new Date().toLocaleDateString("es-ES")}
          </p>
        </div>

        {/* Resumen Ejecutivo */}
        <section className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-2" />
              Resumen: Uso Responsable de Cookies
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-blue-800 dark:text-blue-200">
              <div>
                <h3 className="font-semibold mb-2">✅ Lo que SÍ hacemos:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Cookies esenciales para funcionalidad</li>
                  <li>• Te damos control total sobre preferencias</li>
                  <li>• Solo analytics opcionales (sin terceros)</li>
                  <li>• Transparencia completa</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">❌ Lo que NO hacemos:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Tracking de terceros (Google, Facebook)</li>
                  <li>• Venta de datos a anunciantes</li>
                  <li>• Cookies invasivas</li>
                  <li>• Perfilado sin consentimiento</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Qué son las Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database className="h-6 w-6 mr-2 text-green-600" />
            1. ¿Qué son las Cookies?
          </h2>

          <p className="mb-4">
            Las cookies son pequeños archivos de texto que los sitios web
            almacenan en tu dispositivo para recordar información sobre tu
            visita y preferencias.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              ¿Por qué usamos cookies?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Las cookies nos permiten ofrecerte una experiencia personalizada,
              mantener tu sesión activa, recordar tus preferencias, y analizar
              cómo mejoramos la plataforma.
            </p>
          </div>
        </section>

        {/* 2. Tipos de Cookies que Usamos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            2. Tipos de Cookies que Utilizamos
          </h2>

          {/* Cookies Esenciales */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🔒 Cookies Esenciales
              </h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                Siempre Activas
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Necesarias para el funcionamiento básico de la plataforma. No
              puedes desactivarlas.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Propósito</th>
                    <th className="text-left py-2">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">sb-access-token</td>
                    <td className="py-2">Autenticación de usuario</td>
                    <td className="py-2">1 hora</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">sb-refresh-token</td>
                    <td className="py-2">Renovación de sesión</td>
                    <td className="py-2">30 días</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">csrf-token</td>
                    <td className="py-2">Seguridad contra ataques</td>
                    <td className="py-2">Sesión</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-xs">cookie-consent</td>
                    <td className="py-2">Preferencias de cookies</td>
                    <td className="py-2">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cookies de Analytics */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Cookies de Analytics
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                Opcionales
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Nos ayudan a entender cómo usas la plataforma para mejorar la
              experiencia.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Propósito</th>
                    <th className="text-left py-2">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">story-views</td>
                    <td className="py-2">Conteo de lecturas</td>
                    <td className="py-2">30 días</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">user-preferences</td>
                    <td className="py-2">Filtros y ordenamiento</td>
                    <td className="py-2">90 días</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-xs">usage-stats</td>
                    <td className="py-2">Estadísticas agregadas</td>
                    <td className="py-2">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cookies de Personalización */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🎨 Cookies de Personalización
              </h3>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                Opcionales
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Recuerdan tus preferencias de interfaz y configuraciones
              personalizadas.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Propósito</th>
                    <th className="text-left py-2">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">theme-preference</td>
                    <td className="py-2">Tema claro/oscuro</td>
                    <td className="py-2">1 año</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-xs">editor-settings</td>
                    <td className="py-2">Configuración del editor</td>
                    <td className="py-2">6 meses</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-xs">layout-prefs</td>
                    <td className="py-2">Preferencias de diseño</td>
                    <td className="py-2">6 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Lo que NO usamos */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />❌ Cookies que NO
              Utilizamos
            </h3>
            <ul className="text-red-800 dark:text-red-200 space-y-2">
              <li>
                • <strong>Cookies de terceros:</strong> Google Analytics,
                Facebook Pixel, etc.
              </li>
              <li>
                • <strong>Cookies publicitarias:</strong> Para mostrar anuncios
                personalizados
              </li>
              <li>
                • <strong>Tracking cross-site:</strong> Seguimiento entre
                diferentes sitios web
              </li>
              <li>
                • <strong>Fingerprinting:</strong> Identificación única del
                dispositivo
              </li>
              <li>
                • <strong>Cookies de redes sociales:</strong> Botones de
                compartir con tracking
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Gestión de Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-blue-600" />
            3. Cómo Gestionar tus Cookies
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                🎛️ En Letranido
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                <li>
                  • <strong>Banner inicial:</strong> Configura al registrarte
                </li>
                <li>
                  • <strong>Menú de usuario:</strong> "Configurar Cookies"
                </li>
                <li>
                  • <strong>Cambios inmediatos:</strong> Efecto instantáneo
                </li>
                <li>
                  • <strong>Historial:</strong> Ve cuándo diste consentimiento
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-blue-200 mb-3">
                🌐 En tu Navegador
              </h3>
              <ul className="text-gray-700 dark:text-blue-200 text-sm space-y-2">
                <li>
                  • <strong>Chrome:</strong> Configuración → Privacidad →
                  Cookies
                </li>
                <li>
                  • <strong>Firefox:</strong> Preferencias → Privacidad →
                  Cookies
                </li>
                <li>
                  • <strong>Safari:</strong> Preferencias → Privacidad → Cookies
                </li>
                <li>
                  • <strong>Edge:</strong> Configuración → Cookies y permisos
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mt-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>⚠️ Nota importante:</strong> Desactivar todas las cookies
              puede afectar la funcionalidad de la plataforma. Las cookies
              esenciales son necesarias para mantener tu sesión activa y
              garantizar la seguridad.
            </p>
          </div>
        </section>

        {/* 4. Derechos del Usuario */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            4. Tus Derechos sobre las Cookies
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Derecho al Consentimiento
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Puedes aceptar o rechazar cookies no esenciales en cualquier
                  momento.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Derecho a la Información
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Tienes acceso completo a información sobre qué cookies usamos
                  y por qué.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Derecho de Revocación
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Puedes cambiar tus preferencias de cookies en cualquier
                  momento sin explicación.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Derecho a la Eliminación
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Puedes eliminar cookies existentes desde tu navegador o desde
                  tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Cumplimiento Legal */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            5. Cumplimiento Legal Internacional
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                🇪🇺 GDPR (Europa)
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 text-xs space-y-1">
                <li>• Consentimiento explícito</li>
                <li>• Granularidad en opciones</li>
                <li>• Fácil revocación</li>
                <li>• Base legal clara</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                🇺🇸 CCPA (California)
              </h3>
              <ul className="text-purple-800 dark:text-purple-200 text-xs space-y-1">
                <li>• No venta de datos</li>
                <li>• Derecho de eliminación</li>
                <li>• Transparencia total</li>
                <li>• Opt-out disponible</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                🇧🇷 LGPD (Brasil)
              </h3>
              <ul className="text-green-800 dark:text-green-200 text-xs space-y-1">
                <li>• Finalidad específica</li>
                <li>• Consentimiento libre</li>
                <li>• Portabilidad de datos</li>
                <li>• Minimización de datos</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Actualizaciones */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            6. Actualizaciones de esta Política
          </h2>

          <p className="mb-4">
            Podemos actualizar esta política de cookies ocasionalmente para
            reflejar cambios en nuestras prácticas o por requisitos legales.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Cuando actualicemos:
            </h3>
            <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
              <li>
                • Te notificaremos por email (si tienes notificaciones
                activadas)
              </li>
              <li>• Mostraremos un aviso en la plataforma</li>
              <li>• Actualizaremos la fecha en esta página</li>
              <li>• Cambios importantes requerirán nuevo consentimiento</li>
            </ul>
          </div>
        </section>

        {/* 7. Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            7. Contacto sobre Cookies
          </h2>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-4">
              ¿Preguntas sobre nuestro uso de cookies?
            </h3>
            <div className="text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>Email:</strong> info@letranido.com
              </p>
              <p>
                <strong>Asunto sugerido:</strong> "Consulta sobre Cookies - [Tu
                pregunta]"
              </p>
              <p>
                <strong>Tiempo de respuesta:</strong> 3-5 días hábiles
              </p>
              <p>
                <strong>Idiomas:</strong> Español, Inglés
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-primary-900 dark:text-primary-200 mb-2">
              Control total sobre tus cookies
            </h3>
            <p className="text-primary-700 dark:text-primary-300 text-sm mb-4">
              En Letranido, tu privacidad es nuestra prioridad. Tienes control
              completo sobre cómo usamos las cookies en tu experiencia de
              escritura.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="/privacy-policy"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 underline"
              >
                Política de Privacidad
              </a>
              <a
                href="/terms"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 underline"
              >
                Términos de Servicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
