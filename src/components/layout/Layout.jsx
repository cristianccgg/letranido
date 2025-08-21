// components/layout/Layout.jsx - VERSIÓN COMPLETAMENTE REFACTORIZADA
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";
import { FEATURES } from "../../lib/config";
import AuthModal from "../forms/AuthModal";
import GlobalFooter from "./GlobalFooter";
import UserAvatar from "../ui/UserAvatar";
import CookieBanner from "../ui/CookieBanner";
import NotificationBell from "../ui/NotificationBell";
import ThemeToggle from "../ui/ThemeToggle";
import KarmaRankingsButton from "../ui/KarmaRankingsButton";
import logo from "../../assets/images/letranido-logo.png";

const Layout = ({ children, onFeedbackClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
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

  // ✅ LÓGICA INTELIGENTE: ¿Puede escribir en algún reto?
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

    // Si el actual está en votación y hay próximo reto disponible, puede escribir ahí
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
      // Mostrar para qué reto puede escribir
      if (
        currentContest &&
        !hasUserParticipatedInCurrent &&
        currentContestPhase === "submission"
      ) {
        return "Escribir"; // Para el reto actual
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
      // Si el actual está en votación y hay próximo reto disponible, dirigir ahí
      else if (currentContestPhase === "voting" && nextContest) {
        return { disabled: false, href: `/write/${nextContest.id}` };
      }
      // Fallback al write genérico
      return { disabled: false, href: "/write" };
    }

    if (canWriteInAnyContest()) {
      // Determinar a qué reto debe ir
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
        return isCompactNav ? "Actual (Envío)" : "Reto Actual (Envío)";
      case "voting":
        return isCompactNav
          ? "Actual (Votación)"
          : "Reto Actual (Votación)";
      case "results":
        return isCompactNav
          ? "Actual (Resultados)"
          : "Reto Actual (Resultados)";
      default:
        return isCompactNav ? "Actual" : "Reto Actual";
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
    // ✅ MOSTRAR HISTORIAS LIBRES SI EL FEATURE ESTÁ HABILITADO
    ...(FEATURES.PORTFOLIO_STORIES
      ? [
          {
            name: "Historias Libres",
            href: "/stories",
          },
        ]
      : []),
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
    {
      name: "Ayuda",
      type: "dropdown",
      items: [
        {
          name: "Cómo Funciona",
          href: "/como-funciona",
          icon: BookOpen,
          description:
            "Aprende paso a paso cómo participar en nuestros retos",
        },
        {
          name: "Preguntas Frecuentes",
          href: "/faq",
          icon: HelpCircle,
          description: "Encuentra respuestas a las dudas más comunes",
        },
        {
          name: "Enviar Feedback",
          href: "#feedback",
          icon: MessageCircle,
          description: "Comparte tu opinión para mejorar Letranido",
          isAction: true,
        },
      ],
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
      name: "Reto Actual",
      href: "/contest/current",
    },
    // ✅ MOSTRAR HISTORIAS LIBRES TAMBIÉN PARA USUARIOS NO AUTENTICADOS (pueden leer contenido premium)
    ...(FEATURES.PORTFOLIO_STORIES
      ? [
          {
            name: "Historias Libres",
            href: "/stories",
          },
        ]
      : []),
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
    {
      name: "Ayuda",
      type: "dropdown",
      items: [
        {
          name: "Cómo Funciona",
          href: "/como-funciona",
          icon: BookOpen,
          description:
            "Aprende paso a paso cómo participar en nuestros retos",
        },
        {
          name: "Preguntas Frecuentes",
          href: "/faq",
          icon: HelpCircle,
          description: "Encuentra respuestas a las dudas más comunes",
        },
        {
          name: "Enviar Feedback",
          href: "#feedback",
          icon: MessageCircle,
          description: "Comparte tu opinión para mejorar Letranido",
          isAction: true,
        },
      ],
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
        setIsHelpMenuOpen(false);
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
      <header className="bg-gradient-to-r  from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-r dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 shadow-lg border-b border-indigo-200 dark:border-dark-700 relative z-50 transition-colors duration-300">
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
                  const isDropdownActive = item.items.some(
                    (subItem) => location.pathname === subItem.href
                  );

                  const isDropdownOpen =
                    item.name === "Ayuda"
                      ? isHelpMenuOpen
                      : isResourcesMenuOpen;
                  const setDropdownOpen =
                    item.name === "Ayuda"
                      ? setIsHelpMenuOpen
                      : setIsResourcesMenuOpen;

                  return (
                    <div key={item.name} className="relative">
                      <button
                        onClick={() => setDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center cursor-pointer px-2 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                          isDropdownActive
                            ? "bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm shadow-lg border border-white/40 dark:border-dark-600/40 text-primary-700 dark:text-primary-400 scale-105"
                            : "hover:bg-white/60 dark:hover:bg-dark-800/60 hover:shadow-md hover:scale-105 backdrop-blur-sm border border-transparent hover:border-white/30 dark:hover:border-dark-600/30 text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <ChevronDown
                          className={`ml-1 h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <>
                          {/* Overlay para cerrar el menu */}
                          <div
                            className="fixed inset-0"
                            style={{ zIndex: 9998 }}
                            onClick={() => setDropdownOpen(false)}
                          />
                          <div
                            className="absolute left-0 mt-4 w-80  dark:bg-dark-700 dark:border-primary-500 bg-white  rounded-lg shadow-xl border border-gray-200 py-2"
                            style={{
                              zIndex: 9999,
                              top: "100%",
                              boxShadow:
                                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            {item.items.map((subItem) => {
                              const IconComponent = subItem.icon;
                              const isActive =
                                !subItem.isAction &&
                                location.pathname === subItem.href;

                              if (subItem.isAction) {
                                return (
                                  <button
                                    key={subItem.name}
                                    onClick={() => {
                                      setDropdownOpen(false);
                                      if (
                                        subItem.href === "#feedback" &&
                                        onFeedbackClick
                                      ) {
                                        onFeedbackClick();
                                      }
                                    }}
                                    className="w-full cursor-pointer flex items-start px-4 py-3 transition-colors text-gray-700 dark:text-dark-100 dark:hover:bg-dark-600 hover:bg-gray-50  text-left"
                                  >
                                    <IconComponent className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400 dark:text-dark-100" />
                                    <div>
                                      <div className="font-medium text-sm">
                                        {subItem.name}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 dark:text-indigo-100">
                                        {subItem.description}
                                      </div>
                                    </div>
                                  </button>
                                );
                              }

                              return (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  onClick={() => setDropdownOpen(false)}
                                  className={`flex  items-start  px-4 py-3 transition-colors ${
                                    isActive
                                      ? "bg-indigo-50 text-indigo-700 dark:bg-primary-800 dark:text-indigo-100"
                                      : "text-gray-700 hover:bg-gray-50 dark:text-dark-100 dark:hover:bg-dark-600"
                                  }`}
                                >
                                  <IconComponent
                                    className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                                      isActive
                                        ? "text-indigo-600 dark:text-indigo-100"
                                        : "text-gray-400 dark:text-dark-100"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium text-sm">
                                      {subItem.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 dark:text-dark-300">
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
                          ? "Ya participaste en todos los retos disponibles"
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
              {/* Theme Toggle - Solo en desktop */}
              <div className="hidden lg:block">
                <ThemeToggle size="sm" />
              </div>

              {/* Notification Bell - Solo para usuarios autenticados */}
              {isAuthenticated && location.pathname !== "/reset-password" && (
                <NotificationBell userId={user?.id} />
              )}

              {isAuthenticated && location.pathname !== "/reset-password" ? (
                <div className="relative hidden lg:block">
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
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-700 rounded-lg shadow-xl border border-gray-200 dark:border-dark-600 py-1"
                        style={{
                          zIndex: 9999,
                          top: "100%",
                        }}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-600">
                          <div className="flex items-center space-x-3">
                            <UserAvatar user={user} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-dark-100 truncate">
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
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                          >
                            <User className="h-4 w-4 mr-3 text-gray-400 dark:text-dark-400" />
                            Mi perfil
                          </Link>

                          <Link
                            to="/preferences"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3 text-gray-400 dark:text-dark-400" />
                            Preferencias
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 dark:border-dark-600 py-1">
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex cursor-pointer items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
          <>
            {/* CSS Animation Definition */}
            <style>
              {`
                @keyframes slideDownFadeIn {
                  0% {
                    opacity: 0;
                    transform: translateY(-20px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}
            </style>

            {/* Overlay para blur del fondo - solo debajo del header */}
            <div
              className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div
              className="lg:hidden bg-white dark:bg-gray-900 border-t border-b border-gray-300 dark:border-gray-600 absolute top-full left-0 right-0 z-50 shadow-2xl"
              style={{
                animation:
                  "slideDownFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              <div className="px-4 pt-3 pb-4 space-y-1">
                {navigation.map((item) => {
                  // Handle dropdown items in mobile - Mostrar con dropdown colapsible
                  if (item.type === "dropdown") {
                    const isDropdownActive = item.items.some(
                      (subItem) =>
                        !subItem.isAction && location.pathname === subItem.href
                    );
                    const isDropdownOpen =
                      item.name === "Ayuda"
                        ? isHelpMenuOpen
                        : isResourcesMenuOpen;
                    const setDropdownOpen =
                      item.name === "Ayuda"
                        ? setIsHelpMenuOpen
                        : setIsResourcesMenuOpen;

                    return (
                      <div key={item.name} className="space-y-1">
                        <button
                          onClick={() => setDropdownOpen(!isDropdownOpen)}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                            isDropdownActive
                              ? "text-primary-600 bg-primary-100 dark:bg-primary-800 dark:text-primary-200 shadow-sm"
                              : "text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm"
                          }`}
                        >
                          <span>{item.name}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isDropdownOpen && (
                          <div className="ml-4 space-y-1">
                            {item.items.map((subItem) => {
                              const IconComponent = subItem.icon;
                              const isActive =
                                !subItem.isAction &&
                                location.pathname === subItem.href;

                              if (subItem.isAction) {
                                return (
                                  <button
                                    key={subItem.name}
                                    onClick={() => {
                                      if (
                                        subItem.href === "#feedback" &&
                                        onFeedbackClick
                                      ) {
                                        onFeedbackClick();
                                      }
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <IconComponent className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
                                    <span>{subItem.name}</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={subItem.name}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(subItem.href);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                      ? "text-primary-600 bg-primary-50 dark:bg-primary-900 dark:text-primary-200"
                                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  <IconComponent
                                    className={`h-4 w-4 mr-3 ${isActive ? "text-primary-600 dark:text-primary-200" : "text-gray-400 dark:text-gray-500"}`}
                                  />
                                  <span>{subItem.name}</span>
                                </button>
                              );
                            })}
                          </div>
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
                      className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActive
                          ? "text-primary-600 bg-primary-100 dark:bg-primary-800 dark:text-primary-200 shadow-sm"
                          : `text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm ${
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
                    <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>

                    {/* User Profile Section */}
                    <div className="px-3 py-3 bg-gray-50 dark:bg-dark-800 rounded-lg mx-2 mb-2">
                      <div className="flex items-center space-x-3 mb-2">
                        <UserAvatar user={user} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                            {user?.name || user?.display_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-dark-400 truncate">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                      {!canWriteInAnyContest() && isAuthenticated && (
                        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          ✓ Ya participaste en todos los retos disponibles
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-200"
                    >
                      <User className="h-5 w-5" />
                      <span>Mi perfil</span>
                    </Link>

                    <Link
                      to="/preferences"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-200"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Preferencias</span>
                    </Link>

                    {/* Theme Toggle */}
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <div className="h-5 w-5 flex items-center justify-center">
                        🌙
                      </div>
                      <span className="text-base font-medium text-gray-600 dark:text-dark-300 flex-1">
                        Modo oscuro
                      </span>
                      <ThemeToggle size="sm" />
                    </div>

                    <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>

                    {/* Theme Toggle for non-authenticated users */}
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <div className="h-5 w-5 flex items-center justify-center">
                        🌙
                      </div>
                      <span className="text-base font-medium text-gray-600 dark:text-dark-300 flex-1">
                        Modo oscuro
                      </span>
                      <ThemeToggle size="sm" />
                    </div>

                    <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleAuthClick("login");
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
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
                      className="w-full flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mx-2 my-2"
                    >
                      <span className="text-lg">✨</span>
                      <span>Únete Gratis</span>
                    </button>

                    <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg mx-2 mt-2">
                      <div className="text-sm text-gray-600 dark:text-dark-300">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          ¡Empieza tu aventura!
                        </span>
                        <br />
                        <span className="text-xs">
                          Participa en retos, gana badges y conecta con
                          otros escritores.
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Karma Rankings Button - Solo visible en landing page */}
      {isLanding && <KarmaRankingsButton />}

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
