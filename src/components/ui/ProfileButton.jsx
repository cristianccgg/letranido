import { Link } from "react-router-dom";
import { User, ExternalLink } from "lucide-react";

const ProfileButton = ({
  userId,
  size = "sm",
  variant = "default",
  className = "",
  showIcon = true,
  showText = true,
}) => {
  if (!userId) return null;

  // Configuraciones por tamaño
  const sizeConfig = {
    xs: {
      button: "px-2 py-1 text-xs",
      icon: "w-3 h-3",
      text: "Ver perfil",
    },
    sm: {
      button: "px-3 py-1.5 text-xs",
      icon: "w-3 h-3",
      text: "Ver perfil",
    },
    md: {
      button: "px-4 py-2 text-sm",
      icon: "w-4 h-4",
      text: "Ver perfil",
    },
  };

  // Configuraciones por variante
  const variantConfig = {
    default:
      "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    subtle:
      "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
    primary:
      "bg-purple-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md",
    outline:
      "border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20",
  };

  const config = sizeConfig[size];
  const styles = variantConfig[variant];

  return (
    <Link
      to={`/author/${userId}`}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-lg
        transition-all duration-200 group
        ${config.button} ${styles} ${className}
      `}
      title="Ver perfil público del autor"
      onClick={(e) => e.stopPropagation()}
    >
      {showIcon && (
        <User
          className={`${config.icon} transition-transform group-hover:scale-110`}
        />
      )}
      {showText && <span>{config.text}</span>}
      {variant === "default" && (
        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </Link>
  );
};

export default ProfileButton;
