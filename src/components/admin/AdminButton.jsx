import React from "react";
import { Settings, Shield } from "lucide-react";

const AdminButton = ({ user, currentPath = "" }) => {
  // Solo mostrar a administradores
  const isAdmin = user?.is_admin || user?.email === "admin@literalab.com";

  if (!isAdmin) return null;

  const isActive = currentPath === "/admin";

  return (
    <a
      href="/admin"
      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "text-red-600 bg-red-50"
          : "text-red-600 hover:text-red-700 hover:bg-red-50"
      }`}
      title="Panel de Administración"
    >
      <Shield className="h-4 w-4" />
      <span className="hidden sm:inline">Admin</span>
    </a>
  );
};

export default AdminButton;
