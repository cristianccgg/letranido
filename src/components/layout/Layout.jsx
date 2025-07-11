import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  PenTool,
  BookOpen,
  Users,
  User,
  Menu,
  X,
  BarChart3,
  CheckCircle,
  Shield,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useContests } from "../../hooks/compatibilityHooks";
import { supabase } from "../../lib/supabase";
import AuthModal from "../forms/AuthModal";
import BadgeDisplay from "../BadgeDisplay";
import GlobalFooter from "../layout/GlobalFooter";
import { useBadgeNotifications } from "../../contexts/BadgeNotificationContext";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [hasUserParticipated, setHasUserParticipated] = useState(false);
  const [loadingParticipation, setLoadingParticipation] = useState(false);

  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { currentContest, getContestPhase } = useContests();
  // Usar el método del contexto correcto
  const { showFounderWelcome, closeFounderWelcome } = useBadgeNotifications();

  const isLanding = location.pathname === "/";
  const currentPhase = currentContest ? getContestPhase(currentContest) : null;

  // Verificar si el usuario ya participó en el concurso actual
  useEffect(() => {
    const checkUserParticipation = async () => {
      if (!isAuthenticated || !currentContest || !user) {
        setHasUserParticipated(false);
        return;
      }

      setLoadingParticipation(true);
      try {
        const { data, error } = await supabase
          .from("stories")
          .select("id")
          .eq("contest_id", currentContest.id)
          .eq("user_id", user.id)
          .single();

        setHasUserParticipated(!!data && !error);
      } catch (err) {
        console.error("Error checking participation:", err);
        setHasUserParticipated(false);
      } finally {
        setLoadingParticipation(false);
      }
    };

    checkUserParticipation();
  }, [isAuthenticated, currentContest, user]);

  // Función para obtener el texto del botón "Escribir"
  const getWriteButtonText = () => {
    if (!isAuthenticated) return "Escribir";
    if (loadingParticipation) return "Verificando...";
    if (hasUserParticipated) return "Ya participaste ✓";
    if (currentPhase === "results") return "Ver resultados";
    return "Escribir";
  };

  // Función para obtener el estado del botón "Escribir"
  const getWriteButtonState = () => {
    if (!isAuthenticated) return { disabled: false, href: "/write" };
    if (hasUserParticipated)
      return { disabled: true, href: "/contest/current" };
    if (currentPhase === "results")
      return { disabled: false, href: "/contest/current" };
    return { disabled: false, href: "/write" };
  };

  // Función para obtener el texto de la galería con fase actual
  const getGalleryText = () => {
    if (!currentPhase) return "Galería";

    switch (currentPhase) {
      case "submission":
        return "Concurso Actual (Envío)";
      case "voting":
        return "Concurso Actual (Votación)";
      case "results":
        return "Concurso Actual (Resultados)";
      default:
        return "Concurso Actual";
    }
  };

  const writeButtonState = getWriteButtonState();

  // Navegación para usuarios autenticados
  const authenticatedNavigation = [
    {
      name: getWriteButtonText(),
      href: writeButtonState.href,
      icon: hasUserParticipated ? CheckCircle : PenTool,
      disabled: writeButtonState.disabled,
      className: hasUserParticipated ? "text-green-600" : "",
    },
    { name: getGalleryText(), href: "/contest/current", icon: BookOpen },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    ...(user?.is_admin || user?.email === "admin@literalab.com"
      ? [
          {
            name: "Admin",
            href: "/admin",
            icon: Shield,
            className: "text-red-600 hover:text-red-700",
          },
        ]
      : []),
  ];

  // Navegación para usuarios no autenticados
  const publicNavigation = [
    { name: "Concurso Actual", href: "/contest/current", icon: BookOpen },
  ];

  const navigation = isAuthenticated
    ? authenticatedNavigation
    : publicNavigation;

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleWriteClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      handleAuthClick("register");
    } else if (writeButtonState.disabled && hasUserParticipated) {
      e.preventDefault();
      // Opcional: mostrar mensaje o redirigir
    }
  };

  // Renderizar badges del usuario (excluyendo fundador que se muestra aparte)
  const renderUserBadges = () => {
    if (!user?.badges || user.badges.length === 0) return null;

    // Filtrar badge de fundador para evitar duplicados
    const otherBadges = user.badges.filter((badge) => badge.id !== "founder");

    if (otherBadges.length === 0) return null;

    return (
      <>
        {otherBadges.slice(0, 2).map((badge, index) => (
          <div key={badge.id || index} className="relative group">
            <BadgeDisplay badge={badge} size="xs" showTooltip={false} />
            {/* Tooltip debajo del badge */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                <div className="font-bold">
                  {badge.icon} {badge.name}
                </div>
                <div className="text-gray-300">{badge.description}</div>
                {badge.earnedAt && (
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString("es-ES")}
                  </div>
                )}
                {/* Flecha del tooltip hacia arriba */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          </div>
        ))}
        {otherBadges.length > 2 && (
          <span
            className="text-xs text-gray-500 ml-1"
            title={`${otherBadges.length - 2} badges más`}
          >
            +{otherBadges.length - 2}
          </span>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <PenTool className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">LiteraLab</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium cursor-not-allowed opacity-60 ${
                        item.className || "text-gray-400"
                      }`}
                      title={
                        hasUserParticipated
                          ? "Ya enviaste tu historia para este concurso"
                          : ""
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={
                      item.name.includes("Escribir")
                        ? handleWriteClick
                        : undefined
                    }
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary-600 bg-primary-50"
                        : `hover:text-gray-900 hover:bg-gray-100 ${
                            item.className || "text-gray-600"
                          }`
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    {/* Link del usuario - SIN el badge */}
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 group"
                    >
                      <User className="h-5 w-5" />
                      <div className="hidden sm:block">
                        <span>{user?.name}</span>
                      </div>

                      {/* Dropdown de logout - solo para el usuario */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          logout();
                        }}
                        className="absolute w-fit cursor-pointer text-nowrap left-0 mt-15 bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 hover:text-gray-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                      >
                        Cerrar sesión
                      </button>
                    </Link>

                    {/* Badges SEPARADOS - sin heredar el Link */}
                    <div className="hidden sm:flex items-center gap-1">
                      {/* Badge de fundador especial */}
                      {user?.is_founder && (
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={showFounderWelcome}
                            className="focus:outline-none"
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              margin: 0,
                            }}
                            tabIndex={0}
                          >
                            <BadgeDisplay
                              badge={{
                                id: "founder",
                                name: "Fundador",
                                description: "Miembro fundador de LiteraLab",
                                icon: "🚀",
                                rarity: "legendary",
                                isSpecial: true,
                              }}
                              size="xs"
                              showTooltip={false}
                            />
                          </button>
                          {/* Tooltip debajo del badge */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                            <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                              <div className="font-bold">🚀 Fundador</div>
                              <div className="text-gray-300">
                                Miembro fundador de LiteraLab
                              </div>
                              <div className="text-gray-400 text-xs mt-1">
                                Insignia exclusiva
                              </div>
                              {/* Flecha del tooltip hacia arriba */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Otros badges */}
                      {renderUserBadges()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="items-center space-x-3 hidden md:flex">
                  <button
                    onClick={() => handleAuthClick("login")}
                    className="text-gray-600 cursor-pointer hover:text-gray-900 font-medium"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => handleAuthClick("register")}
                    className="btn-primary cursor-pointer"
                  >
                    Registrarse
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Simplificado */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Items */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium cursor-not-allowed opacity-60 ${
                        item.className || "text-gray-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.name}
                    onClick={(e) => {
                      e.preventDefault(); // Evitar cualquier comportamiento por defecto

                      if (item.name.includes("Escribir")) {
                        handleWriteClick(e);
                      } else {
                        navigate(item.href);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "text-primary-600 bg-primary-50"
                        : `text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${
                            item.className || ""
                          }`
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {/* Auth Options - Simplificado */}
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />
                    <span>Mi perfil</span>
                    {user?.is_founder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          showFounderWelcome();
                        }}
                        className="focus:outline-none"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                        }}
                        tabIndex={0}
                      >
                        <BadgeDisplay
                          badge={{
                            id: "founder",
                            name: "Fundador",
                            description: "Miembro fundador de LiteraLab",
                            icon: "🚀",
                            rarity: "legendary",
                            isSpecial: true,
                          }}
                          size="xs"
                        />
                      </button>
                    )}
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v4"
                      />
                    </svg>
                    <span>Cerrar sesión</span>
                  </button>

                  <div className="px-3 py-2 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-500">Conectado como:</div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </div>
                      {user?.is_founder && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          🚀 Fundador
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                    {hasUserParticipated && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Ya participaste en el concurso actual
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleAuthClick("login");
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m0 0v3H3v2h8v3z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Iniciar sesión</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleAuthClick("register");
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                  >
                    <User className="h-5 w-5" />
                    <span>Registrarse gratis</span>
                  </button>

                  <div className="px-3 py-2 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-500">
                      Regístrate para participar en concursos y votar por tus
                      historias favoritas.
                    </div>
                    <div className="mt-2 text-xs text-yellow-600 font-medium">
                      🚀 ¡Únete ahora y obtén la insignia de Fundador!
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
        className={
          isLanding ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }
      >
        {children}
      </main>
      <GlobalFooter />
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
    </div>
  );
};

export default Layout;
