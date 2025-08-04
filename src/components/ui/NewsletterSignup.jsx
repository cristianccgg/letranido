import { useState } from "react";
import { Mail, Bell, CheckCircle, AlertCircle, Loader } from "lucide-react";
const subscribeToNewsletter = async (email) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contest-emails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        "authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ 
        emailType: "newsletter_subscription",
        email: email 
      }),
    }
  );

  return await response.json();
};

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Por favor ingresa un email válido");
      return;
    }

    setStatus("loading");

    try {
      // Suscribir al newsletter con lógica inteligente
      const result = await subscribeToNewsletter(email);

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setEmail("");

        // Reset después de 8 segundos
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 8000);
      } else {
        setStatus("error");
        setMessage(result.message);

        // Reset después de 5 segundos para errores
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      }
    } catch (error) {
      console.error("Error en suscripción de newsletter:", error);
      
      // Si es error de red pero la función pudo haber funcionado
      if (error.message.includes("Load failed") || error.message.includes("502")) {
        setStatus("error");
        setMessage(
          "Error de conexión. Si ya tenías cuenta, es posible que la suscripción se haya activado. Verifica en tu perfil."
        );
      } else {
        setStatus("error");
        setMessage(
          "Hubo un error inesperado. Inténtalo de nuevo en unos minutos."
        );
      }

      // Reset después de 8 segundos para errores de red
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 8000);
    }
  };

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 relative overflow-hidden transition-colors duration-300">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-10 blur-xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* Título principal */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Bell className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-dark-100 mb-4 tracking-tight transition-colors duration-300">
            ¿No quieres perderte el próximo concurso?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-dark-300 max-w-2xl mx-auto transition-colors duration-300">
            Recibe una notificación cuando inicie el siguiente concurso.{" "}
            <span className="text-indigo-600 dark:text-indigo-400 font-medium transition-colors duration-300">
              Sin spam, solo los concursos nuevos.
            </span>
          </p>
        </div>

        {/* Formulario de email */}
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-dark-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={status === "loading" || status === "success"}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-600 rounded-xl text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Suscribiendo...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  ¡Suscrito!
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5" />
                  Notificarme del próximo concurso
                </>
              )}
            </button>
          </form>

          {/* Mensaje de estado */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
                status === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}
        </div>

        {/* Beneficios */}
        <div className="mt-8 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Notificación oportuna
            </h3>
            <p className="text-sm text-gray-600">
              Te avisamos justo cuando inicia
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Sin spam</h3>
            <p className="text-sm text-gray-600">
              Solo concursos nuevos, nada más
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Fácil cancelación
            </h3>
            <p className="text-sm text-gray-600">
              Cancela en cualquier momento
            </p>
          </div>
        </div>

        {/* Texto legal pequeño */}
        <p className="mt-6 text-xs text-gray-500 max-w-2xl mx-auto">
          Al suscribirte, aceptas recibir emails sobre nuevos concursos de
          Letranido. Puedes cancelar en cualquier momento. No compartimos tu
          email con terceros.
        </p>
      </div>
    </section>
  );
};

export default NewsletterSignup;
