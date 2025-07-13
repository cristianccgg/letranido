// components/layout/Layout.jsx - VERSIÓN COMPLETAMENTE REFACTORIZADA
import { useState } from "react";
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
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import AuthModal from "../forms/AuthModal";
import GlobalFooter from "./GlobalFooter";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // ✅ TODO DESDE EL CONTEXTO UNIFICADO - sin hooks múltiples
  const {
    user,
    isAuthenticated,
    currentContest,
    currentContestPhase,
    userStories,
    userStoriesLoading,
    // Función de logout que necesitaremos implementar en el contexto
    logout: contextLogout,
  } = useGlobalApp();
  const isLanding = location.pathname === "/";

  // ✅ VERIFICACIÓN DE PARTICIPACIÓN DIRECTA - sin estado local ni useEffect
  const hasUserParticipated =
    isAuthenticated && currentContest && !userStoriesLoading
      ? userStories.some((story) => story.contest_id === currentContest.id)
      : false;

  // ✅ LOGOUT SIMPLIFICADO
  const handleLogout = async () => {
    try {
      // Implementar logout en el contexto global
      await contextLogout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // ✅ LÓGICA DE BOTONES SIMPLIFICADA
  const getWriteButtonText = () => {
    if (userStoriesLoading) return "Verificando...";
    if (!isAuthenticated) return "Escribir";
    if (hasUserParticipated) return "Ya participaste ✓";
    if (currentContestPhase === "results") return "Ver resultados";
    return "Escribir";
  };

  const getWriteButtonState = () => {
    if (userStoriesLoading) return { disabled: true, href: "#" };
    if (!isAuthenticated) return { disabled: false, href: "/write" };
    if (hasUserParticipated)
      return { disabled: true, href: "/contest/current" };
    if (currentContestPhase === "results")
      return { disabled: false, href: "/contest/current" };
    return { disabled: false, href: "/write" };
  };

  const getGalleryText = () => {
    if (!currentContestPhase) return "Galería";
    switch (currentContestPhase) {
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

  // ✅ NAVEGACIÓN DINÁMICA SIMPLIFICADA
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
    }
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
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 group"
                    >
                      <User className="h-5 w-5" />
                      <div className="hidden sm:block">
                        <span>{user?.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="absolute w-fit cursor-pointer text-nowrap left-0 mt-15 bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 hover:text-gray-900 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                      >
                        Cerrar sesión
                      </button>
                    </Link>

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
                      e.preventDefault();
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

              {/* Mobile Auth Section */}
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
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
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
// El componente usa el contexto correctamente y no causa el bug.
