// components/layout/Layout.jsx - VERSIÓN COMPLETAMENTE REFACTORIZADA
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Menu, X, ChevronDown, LogOut, Settings } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import AuthModal from "../forms/AuthModal";
import GlobalFooter from "./GlobalFooter";
import UserAvatar from "../ui/UserAvatar";
import CookieBanner from "../ui/CookieBanner";
import NotificationBell from "../ui/NotificationBell";
import ThemeToggle from "../ui/ThemeToggle";
import logo from "../../assets/images/letranido-logo.png";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);
  const [isCompactNav, setIsCompactNav] = useState(false);

  // ✅ TODO DESDE EL CONTEXTO UNIFICADO - sin hooks múltiples
  const {
    user,
    isAuthenticated,
    currentContest,
    nextContest, // ✅ Añadido para dual contests
    currentContestPhase,
    userStories,
    userStoriesLoading,
    contests,
    logout,
    // Auth Modal desde contexto global
    showAuthModal: authModalVisible,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    // Cookie Banner desde contexto global
    showCookieBanner,
  } = useGlobalApp();
  const isLanding = location.pathname === "/";

  // ✅ VERIFICACIÓN DE PARTICIPACIÓN DIRECTA - sin estado local ni useEffect
  const hasUserParticipatedInCurrent =
    isAuthenticated && currentContest && !userStoriesLoading
      ? userStories.some((story) => story.contest_id === currentContest.id)
      : false;

  const hasUserParticipatedInNext =
    isAuthenticated && nextContest && !userStoriesLoading
      ? userStories.some((story) => story.contest_id === nextContest.id)
      : false;

  // ✅ LÓGICA INTELIGENTE: ¿Puede escribir en algún concurso?
  const canWriteInAnyContest = () => {
    if (!isAuthenticated) return true; // Siempre puede empezar a escribir (se registrará)

    // Si no participó en el actual, puede escribir ahí
    if (
      currentContest &&
      !hasUserParticipatedInCurrent &&
      currentContestPhase === "submission"
    ) {
      return true;
    }

    // Si el actual está en votación y hay próximo concurso disponible, puede escribir ahí
    if (
      currentContestPhase === "voting" &&
      nextContest &&
      !hasUserParticipatedInNext
    ) {
      return true;
    }

    return false;
  };

  // ✅ VERIFICAR SI HAY CONCURSOS FINALIZADOS PARA MOSTRAR HISTORIAL
  const hasFinishedContests = contests.some(
    (contest) => contest.status === "results"
  );

  // ✅ LOGOUT SIMPLIFICADO
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // ✅ LÓGICA DE BOTONES INTELIGENTE PARA DUAL CONTESTS
  const getWriteButtonText = () => {
    if (userStoriesLoading) return "Verificando...";
    if (!isAuthenticated) return "Escribir";

    if (canWriteInAnyContest()) {
      // Mostrar para qué concurso puede escribir
      if (
        currentContest &&
        !hasUserParticipatedInCurrent &&
        currentContestPhase === "submission"
      ) {
        return "Escribir"; // Para el concurso actual
      } else if (
        currentContestPhase === "voting" &&
        nextContest &&
        !hasUserParticipatedInNext
      ) {
        // Texto más compacto para pantallas medianas
        return isCompactNav
          ? `Escribir (${nextContest.month.slice(0, 3)})`
          : `Escribir (${nextContest.month})`;
      }
      return "Escribir";
    }

    if (currentContestPhase === "results") return "Ver resultados";
    return "Ya participaste";
  };

  const getWriteButtonState = () => {
    if (userStoriesLoading) return { disabled: true, href: "#" };

    // Para usuarios no autenticados, usar la misma lógica inteligente
    if (!isAuthenticated) {
      // Si el actual está abierto para envíos, dirigir ahí
      if (currentContest && currentContestPhase === "submission") {
        return { disabled: false, href: `/write/${currentContest.id}` };
      }
      // Si el actual está en votación y hay próximo concurso disponible, dirigir ahí
      else if (currentContestPhase === "voting" && nextContest) {
        return { disabled: false, href: `/write/${nextContest.id}` };
      }
      // Fallback al write genérico
      return { disabled: false, href: "/write" };
    }

    if (canWriteInAnyContest()) {
      // Determinar a qué concurso debe ir
      if (
        currentContest &&
        !hasUserParticipatedInCurrent &&
        currentContestPhase === "submission"
      ) {
        return { disabled: false, href: `/write/${currentContest.id}` };
      } else if (
        currentContestPhase === "voting" &&
        nextContest &&
        !hasUserParticipatedInNext
      ) {
        return { disabled: false, href: `/write/${nextContest.id}` };
      }
      return { disabled: false, href: "/write" };
    }

    if (currentContestPhase === "results") {
      return { disabled: false, href: "/contest/current" };
    }

    // Ya participó en todo lo disponible
    return { disabled: true, href: "#" };
  };

  const getGalleryText = () => {
    if (!currentContestPhase) return "Galería";
    switch (currentContestPhase) {
      case "submission":
        return isCompactNav ? "Actual (Envío)" : "Concurso Actual (Envío)";
      case "voting":
        return isCompactNav
          ? "Actual (Votación)"
          : "Concurso Actual (Votación)";
      case "results":
        return isCompactNav
          ? "Actual (Resultados)"
          : "Concurso Actual (Resultados)";
      default:
        return isCompactNav ? "Actual" : "Concurso Actual";
    }
  };

  const writeButtonState = getWriteButtonState();

  // ✅ NAVEGACIÓN DINÁMICA SIMPLIFICADA - Sin iconos
  const authenticatedNavigation = [
    {
      name: "Inicio",
      href: "/",
    },
    {
      name: getWriteButtonText(),
      href: writeButtonState.href,
      disabled: writeButtonState.disabled,
      className:
        !canWriteInAnyContest() && isAuthenticated ? "text-green-600" : "",
    },
    {
      name: getGalleryText(),
      href: "/contest/current",
    },
    // ✅ MOSTRAR HISTORIAL SOLO SI HAY CONCURSOS FINALIZADOS
    ...(hasFinishedContests
      ? [
          {
            name: "Historial",
            href: "/contest-history",
          },
        ]
      : []),
    {
      name: "Blog",
      href: "/blog",
    },
    ...(user?.is_admin || user?.email === "admin@literalab.com"
      ? [
          {
            name: "Admin",
            href: "/admin",
            className: "text-red-600 hover:text-red-700",
          },
        ]
      : []),
  ];

  const publicNavigation = [
    {
      name: "Inicio",
      href: "/",
    },
    {
      name: "Escribir Historia",
      href: writeButtonState.href,
    },
    {
      name: "Concurso Actual",
      href: "/contest/current",
    },
    // ✅ MOSTRAR HISTORIAL TAMBIÉN PARA USUARIOS NO AUTENTICADOS SI HAY CONCURSOS FINALIZADOS
    ...(hasFinishedContests
      ? [
          {
            name: "Historial",
            href: "/contest-history",
          },
        ]
      : []),
    {
      name: "Blog",
      href: "/blog",
    },
  ];

  // No mostrar navegación de usuario autenticado en página de reset
  const navigation =
    isAuthenticated && location.pathname !== "/reset-password"
      ? authenticatedNavigation
      : publicNavigation;

  const handleAuthClick = (mode) => {
    // No abrir modal si estamos en la página de reset de contraseña
    if (location.pathname === "/reset-password") {
      return;
    }
    openAuthModal(mode);
  };

  const handleWriteClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      handleAuthClick("register");
    } else if (writeButtonState.disabled) {
      e.preventDefault();
    }
  };

  // Manejar responsive navigation y cerrar dropdown cuando se presiona Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsResourcesMenuOpen(false);
      }
    };

    const handleResize = () => {
      setIsCompactNav(window.innerWidth < 1280);
    };

    // Set initial state
    handleResize();

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-r dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-gradient-to-r  from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-r dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 shadow-lg border-b border-indigo-200 dark:border-dark-700 relative z-30 transition-colors duration-300">
        <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-full">
          <div className="flex justify-between items-center h-16 min-w-0 max-w-7xl mx-auto">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-1 sm:space-x-0 flex-shrink-0"
            >
              <img src={logo} alt="Letranido" className="xl:h-18 h-15 w-auto" />
              <span className="text-lg sm:text-xl xl:text-4xl text-primary-600 dark:text-primary-400 font-dm-serif transition-colors duration-300">
                Letranido
              </span>
              {location.pathname === "/reset-password" && (
                <span className="text-gray-500 dark:text-dark-400 text-sm ml-2 transition-colors duration-300">
                  - Restablecer contraseña
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-2 xl:space-x-4 flex-1 justify-center min-w-0">
              {navigation.map((item) => {
                // Handle dropdown items
                if (item.type === "dropdown") {
                  const isResourcesActive = item.items.some(
                    (subItem) => location.pathname === subItem.href
                  );

                  return (
                    <div key={item.name} className="relative">
                      <button
                        onClick={() =>
                          setIsResourcesMenuOpen(!isResourcesMenuOpen)
                        }
                        className={`flex items-center px-2 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                          isResourcesActive
                            ? "bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm shadow-lg border border-white/40 dark:border-dark-600/40 text-primary-700 dark:text-primary-400 scale-105"
                            : "hover:bg-white/60 dark:hover:bg-dark-800/60 hover:shadow-md hover:scale-105 backdrop-blur-sm border border-transparent hover:border-white/30 dark:hover:border-dark-600/30 text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <ChevronDown
                          className={`ml-1 h-3 w-3 transition-transform duration-200 ${isResourcesMenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isResourcesMenuOpen && (
                        <>
                          {/* Overlay para cerrar el menu */}
                          <div
                            className="fixed inset-0"
                            style={{ zIndex: 9998 }}
                            onClick={() => setIsResourcesMenuOpen(false)}
                          />
                          <div
                            className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
                            style={{
                              zIndex: 9999,
                              top: "100%",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              boxShadow:
                                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            {item.items.map((subItem) => {
                              const IconComponent = subItem.icon;
                              const isActive =
                                location.pathname === subItem.href;

                              return (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  onClick={() => setIsResourcesMenuOpen(false)}
                                  className={`flex items-start px-4 py-3 transition-colors ${
                                    isActive
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <IconComponent
                                    className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                                      isActive
                                        ? "text-indigo-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium text-sm">
                                      {subItem.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {subItem.description}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                // Handle regular navigation items
                const isActive = location.pathname === item.href;

                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium cursor-not-allowed opacity-60 whitespace-nowrap ${
                        item.className || "text-gray-400"
                      }`}
                      title={
                        !canWriteInAnyContest() && isAuthenticated
                          ? "Ya participaste en todos los concursos disponibles"
                          : ""
                      }
                    >
                      <span className="truncate">{item.name}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={
                      item.name.includes("Escribir") && isAuthenticated
                        ? handleWriteClick
                        : undefined
                    }
                    className={`flex items-center px-2 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? "bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm shadow-lg border border-white/40 dark:border-dark-600/40 text-primary-700 dark:text-primary-400 scale-105"
                        : `hover:bg-white/60 dark:hover:bg-dark-800/60 hover:shadow-md hover:scale-105 backdrop-blur-sm border border-transparent hover:border-white/30 dark:hover:border-dark-600/30 ${
                            item.className ||
                            "text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
                          }`
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
              {/* Theme Toggle */}
              <ThemeToggle size="sm" />

              {/* Notification Bell - Solo para usuarios autenticados */}
              {isAuthenticated && location.pathname !== "/reset-password" && (
                <NotificationBell userId={user?.id} />
              )}

              {isAuthenticated && location.pathname !== "/reset-password" ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center cursor-pointer space-x-2 text-sm text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg px-3 py-2 transition-colors duration-300"
                  >
                    <UserAvatar user={user} size="sm" />
                    <div className="hidden sm:block text-left min-w-0">
                      <div className="font-medium text-gray-900 dark:text-dark-100 truncate transition-colors duration-300">
                        {user?.name || user?.display_name}
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      {/* Overlay para cerrar el menu */}
                      <div
                        className="fixed inset-0"
                        style={{ zIndex: 9998 }}
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div
                        className="absolute  right-0 mt-2 w-56 bg-white dark:bg-dark-700 rounded-lg shadow-xl border border-gray-200 py-1"
                        style={{
                          zIndex: 9999,
                          top: "100%",
                          border: "1px solid #e5e7eb",
                          boxShadow:
                            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100 ">
                          <div className="flex items-center space-x-3">
                            <UserAvatar user={user} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-dark-300 truncate">
                                {user?.name || user?.display_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-dark-400 truncate">
                                {user?.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                          >
                            <User className="h-4 w-4 mr-3 text-gray-400 dark:text-dark-300" />
                            Mi perfil
                          </Link>

                          <Link
                            to="/preferences"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3 text-gray-400 dark:text-dark-300" />
                            Preferencias
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex cursor-pointer items-center px-4 py-2 text-sm text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-dark-600 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : location.pathname !== "/reset-password" ? (
                <div className="items-center space-x-2 lg:space-x-3 hidden lg:flex">
                  <button
                    onClick={() => handleAuthClick("login")}
                    className="text-gray-600 dark:text-dark-300 cursor-pointer hover:text-gray-900 dark:hover:text-dark-100 font-medium text-sm md:text-base transition-colors duration-300"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => handleAuthClick("register")}
                    className="relative overflow-hidden group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold px-3 md:px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer text-sm md:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      ✨ Únete Gratis
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              ) : null}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors duration-300"
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
          <div className="lg:hidden bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 border-t border-indigo-200 dark:border-dark-700 transition-colors duration-300">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                // Handle dropdown items in mobile
                if (item.type === "dropdown") {
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.name}
                      </div>
                      {item.items.map((subItem) => {
                        const IconComponent = subItem.icon;
                        const isActive = location.pathname === subItem.href;

                        return (
                          <button
                            key={subItem.name}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(subItem.href);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center px-6 py-3 rounded-md text-sm font-medium ${
                              isActive
                                ? "text-primary-600 bg-primary-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <IconComponent
                              className={`h-4 w-4 mr-3 ${
                                isActive ? "text-primary-600" : "text-gray-400"
                              }`}
                            />
                            <div className="text-left">
                              <div className="font-medium">{subItem.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {subItem.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                // Handle regular navigation items
                const isActive = location.pathname === item.href;

                if (item.disabled) {
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium cursor-not-allowed opacity-60 ${
                        item.className || "text-gray-400"
                      }`}
                    >
                      <span>{item.name}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.name}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.name.includes("Escribir") && isAuthenticated) {
                        handleWriteClick(e);
                      } else {
                        navigate(item.href);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "text-primary-600 bg-primary-50"
                        : `text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${
                            item.className || ""
                          }`
                    }`}
                  >
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {/* Mobile Auth Section */}
              {isAuthenticated && location.pathname !== "/reset-password" ? (
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
                    </div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                    {!canWriteInAnyContest() && isAuthenticated && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Ya participaste en todos los concursos disponibles
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
                    className="w-full flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="text-lg">✨</span>
                    <span>Únete Gratis</span>
                  </button>

                  <div className="px-3 py-2 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-indigo-600">
                        ¡Empieza tu aventura!
                      </span>
                      <br />
                      Participa en concursos, gana badges y conecta con otros
                      escritores.
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

      {/* Auth Modal - NO mostrar en página de reset de contraseña */}
      {authModalVisible && location.pathname !== "/reset-password" && (
        <AuthModal
          isOpen={authModalVisible}
          onClose={() => {
            closeAuthModal();
          }}
          onSuccess={() => {
            // El contexto global se encarga de cerrar automáticamente
            // cuando isAuthenticated se vuelve true
          }}
          initialMode={authModalMode}
        />
      )}

      {/* Cookie Banner */}
      {showCookieBanner && <CookieBanner />}
    </div>
  );
};

export default Layout;
// El componente usa el contexto correctamente y no causa el bug.
