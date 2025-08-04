import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeToggle = ({ size = "md", className = "" }) => {
  const { toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: "h-8 w-16",
    md: "h-10 w-20",
    lg: "h-12 w-24",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center cursor-pointer rounded-full p-1 transition-all duration-300 ease-in-out
        ${sizeClasses[size]}
        ${
          isDark
            ? "bg-indigo-400 hover:bg-indigo-500 border border-indigo-500"
            : "bg-indigo-400 hover:bg-indigo-500 border border-gray-300"
        }
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${isDark ? "focus:ring-offset-gray-800" : "focus:ring-offset-white"}
        ${className}
      `}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Toggle circle with proper sizing */}
      <div
        className={`
          relative rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
          flex items-center justify-center
          ${size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-10 w-10"}
          ${isDark ? (size === "sm" ? "translate-x-8" : size === "md" ? "translate-x-10" : "translate-x-12") : "translate-x-0"}
        `}
      >
        {isDark ? (
          <Moon className={`${iconSizes[size]} text-indigo-600`} />
        ) : (
          <Sun className={`${iconSizes[size]} text-yellow-500`} />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
