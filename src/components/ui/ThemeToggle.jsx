import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeToggle = ({ size = "md", className = "" }) => {
  const { toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: "h-8 w-14",
    md: "h-10 w-18",
    lg: "h-12 w-22",
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
        relative inline-flex items-center rounded-full p-1 transition-all duration-300 ease-in-out
        ${sizeClasses[size]}
        ${
          isDark
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-200 hover:bg-gray-300"
        }
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${isDark ? "focus:ring-offset-gray-800" : "focus:ring-offset-white"}
        ${className}
      `}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {/* Toggle circle */}
      <div
        className={`
          absolute inset-1 rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
          flex items-center justify-center
          ${isDark ? "translate-x-8" : "translate-x-0"}
        `}
      >
        {isDark ? (
          <Moon className={`${iconSizes[size]} text-indigo-600`} />
        ) : (
          <Sun className={`${iconSizes[size]} text-yellow-500`} />
        )}
      </div>

      {/* Background icons for visual feedback */}
      <div className="flex w-full justify-between items-center px-2">
        <Sun
          className={`${iconSizes[size]} text-yellow-300 ${!isDark ? "opacity-0" : "opacity-30"} transition-opacity duration-300`}
        />
        <Moon
          className={`${iconSizes[size]} text-indigo-300 ${isDark ? "opacity-0" : "opacity-30"} transition-opacity duration-300`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
