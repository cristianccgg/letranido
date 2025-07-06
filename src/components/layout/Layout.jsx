import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PenTool, BookOpen, Users, User, Menu, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import AuthModal from "../forms/AuthModal";

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const isLanding = location.pathname === "/";

  const navigation = [
    { name: "Escribir", href: "/write", icon: PenTool },
    { name: "Galería", href: "/gallery", icon: BookOpen },
    { name: "Comunidad", href: "/community", icon: Users },
  ];

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
              {isAuthenticated &&
                navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === item.href
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:block">{user?.name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden sm:block text-gray-600 hover:text-gray-900 font-medium text-sm"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-primary"
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Items (solo si está autenticado) */}
              {isAuthenticated &&
                navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === item.href
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

              {/* Separador si hay items de navegación */}
              {isAuthenticated && (
                <div className="border-t border-gray-200 my-2"></div>
              )}

              {/* Auth Options */}
              {isAuthenticated ? (
                <>
                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />
                    <span>Mi perfil</span>
                  </Link>

                  {/* Dashboard Link */}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Users className="h-5 w-5" />
                    <span>Mi dashboard</span>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      useAuthStore.getState().logout();
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

                  {/* User Info */}
                  <div className="px-3 py-2 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-500">Conectado como:</div>
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                  </div>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowAuthModal(true);
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

                  {/* Register Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                  >
                    <User className="h-5 w-5" />
                    <span>Registrarse gratis</span>
                  </button>

                  {/* Guest Info */}
                  <div className="px-3 py-2 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-500">
                      Regístrate para participar en concursos y votar por tus
                      historias favoritas.
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

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default Layout;
