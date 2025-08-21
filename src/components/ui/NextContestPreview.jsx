import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader,
  PenTool,
  Users,
} from "lucide-react";
import ContestActionButton from "./ContestActionButton";

const NextContestPreview = ({ nextContest, currentContest, isEnabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // Estados para newsletter
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle"); // idle, loading, success, error
  const [newsletterMessage, setNewsletterMessage] = useState("");

  // Solo mostrar si hay un siguiente reto y hay un reto actual activo
  useEffect(() => {
    setShouldShow(
      nextContest && currentContest && currentContest.status !== "results"
    );
  }, [nextContest, currentContest]);

  // Función para suscribirse al newsletter
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!email || !email.includes("@")) {
      setNewsletterStatus("error");
      setNewsletterMessage("Por favor ingresa un email válido");
      return;
    }

    setNewsletterStatus("loading");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contest-emails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            emailType: "newsletter_subscription",
            email: email,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setNewsletterStatus("success");
        setNewsletterMessage(result.message);
        setEmail("");

        // Reset después de 6 segundos
        setTimeout(() => {
          setNewsletterStatus("idle");
          setNewsletterMessage("");
        }, 6000);
      } else {
        setNewsletterStatus("error");
        setNewsletterMessage(result.message);

        // Reset después de 4 segundos para errores
        setTimeout(() => {
          setNewsletterStatus("idle");
          setNewsletterMessage("");
        }, 4000);
      }
    } catch (error) {
      console.error("Error en suscripción de newsletter:", error);

      // Si es error de red pero la función pudo haber funcionado
      if (
        error.message.includes("Load failed") ||
        error.message.includes("502")
      ) {
        setNewsletterStatus("error");
        setNewsletterMessage(
          "Error de conexión. Si ya tenías cuenta, es posible que la suscripción se haya activado."
        );
      } else {
        setNewsletterStatus("error");
        setNewsletterMessage("Error inesperado. Inténtalo de nuevo.");
      }

      // Reset después de 6 segundos para errores de red
      setTimeout(() => {
        setNewsletterStatus("idle");
        setNewsletterMessage("");
      }, 6000);
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="relative mt-6 ">
      {/* Contenedor principal con animación */}
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 border-2 border-purple-100 shadow-lg transition-all duration-700 ease-out ${
          isExpanded ? "max-h-[32rem] opacity-100" : "max-h-20 opacity-90"
        }`}
      >
        {/* Botón de expansión */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center cursor-pointer justify-between hover:bg-white/20 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            {/* Icono animado */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              {/* Pulso animado */}
              <div className="absolute inset-0 w-10 h-10 bg-purple-400 rounded-full animate-pulse opacity-20"></div>
            </div>

            {/* Texto principal */}
            <div className="text-left">
              <span className="text-sm font-medium text-purple-600 block">
                Próximo reto
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                {nextContest.title}
              </span>
            </div>
          </div>

          {/* Flecha con animación */}
          <ChevronRight
            className={`h-5 w-5 text-purple-600 transition-transform duration-300 ${
              isExpanded ? "rotate-90" : "group-hover:translate-x-1"
            }`}
          />
        </button>

        {/* Contenido expandido */}
        <div
          className={`px-4 pb-4 transition-all duration-500 ${
            isExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
        >
          {/* Descripción del reto */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">
              {nextContest.description}
            </p>
          </div>

          {/* Información del reto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de inicio (basada en voting_deadline del actual + 1 día) */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>
                Inicia:{" "}
                {currentContest?.voting_deadline
                  ? (() => {
                      const nextDay = new Date(currentContest.voting_deadline);
                      nextDay.setDate(nextDay.getDate() + 1);
                      return nextDay.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                    })()
                  : "Por confirmar"}
              </span>
            </div>

            {/* Mes del reto (calculado dinámicamente) */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>
                {currentContest?.voting_deadline
                  ? (() => {
                      const nextDay = new Date(currentContest.voting_deadline);
                      nextDay.setDate(nextDay.getDate() + 1);
                      const monthName = nextDay.toLocaleDateString("es-ES", {
                        month: "long",
                      });
                      const capitalizedMonth =
                        monthName.charAt(0).toUpperCase() + monthName.slice(1);
                      return `Concurso de ${capitalizedMonth}`;
                    })()
                  : `Concurso de ${nextContest.month}`}
              </span>
            </div>
          </div>

          {/* Información de preparación */}
          <div className="mt-4 space-y-3">
            {/* Requisitos del reto */}
            {nextContest.word_limit && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Requisitos
                  </span>
                </div>
                <p className="text-sm text-purple-700">
                  Máximo {nextContest.word_limit} palabras
                </p>
              </div>
            )}

            {/* Consejos de preparación 
            <div className="bg-gradient-to-r flex flex-col justify-center items-center from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
              <div className="flex justify-center items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium  text-purple-800">
                  Consejos para prepararte
                </span>
              </div>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Lee el prompt con atención</li>
                <li>• Planifica tu historia antes de escribir</li>
                <li>• Revisa la ortografía y gramática</li>
                <li>• ¡Deja volar tu creatividad!</li>
              </ul>
            </div>*/}

            {/* Botones de acción del reto */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <div className={`flex-1 ${!isEnabled ? 'opacity-50' : ''}`}>
                <ContestActionButton
                  variant="primary"
                  size="default"
                  showDescription={false}
                  className="w-full"
                  contestId={nextContest?.id}
                  disabled={!isEnabled}
                />
              </div>
              
              <Link
                to={isEnabled && nextContest ? `/contest/${nextContest.id}#stories-section` : "#"}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 ${
                  isEnabled 
                    ? "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                onClick={!isEnabled ? (e) => e.preventDefault() : undefined}
              >
                <Users className="h-4 w-4 mr-2" />
                Ver participantes
              </Link>
            </div>

            {/* Estado del reto */}
            <div className={`rounded-lg p-3 mb-4 ${
              isEnabled 
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isEnabled 
                    ? "bg-green-500 animate-pulse" 
                    : "bg-gray-400"
                }`}></div>
                <span className={`text-sm font-medium ${
                  isEnabled 
                    ? "text-green-700" 
                    : "text-gray-500"
                }`}>
                  {isEnabled 
                    ? `¡Ya puedes escribir tu historia para ${nextContest?.month}!`
                    : `Se activará cuando termine la votación del reto actual.`
                  }
                </span>
              </div>
            </div>

            {/* Newsletter Signup integrado */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-4 mt-2">
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bell className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ¿Te avisamos cuando inicie?
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Recibe una notificación cuando este reto comience
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    disabled={
                      newsletterStatus === "loading" ||
                      newsletterStatus === "success"
                    }
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    newsletterStatus === "loading" ||
                    newsletterStatus === "success"
                  }
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {newsletterStatus === "loading" ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Suscribiendo...
                    </>
                  ) : newsletterStatus === "success" ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      ¡Suscrito!
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      Notificarme
                    </>
                  )}
                </button>
              </form>

              {/* Mensaje de estado */}
              {newsletterMessage && (
                <div
                  className={`mt-3 p-2 rounded-lg flex items-center gap-2 text-xs ${
                    newsletterStatus === "success"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {newsletterStatus === "success" ? (
                    <CheckCircle className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span>{newsletterMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Línea conectora sutil */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gradient-to-b from-purple-200 to-transparent"></div>
    </div>
  );
};

export default NextContestPreview;
