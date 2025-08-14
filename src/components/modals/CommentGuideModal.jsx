// components/modals/CommentGuideModal.jsx
import { useState } from "react";
import { X, Heart, Lightbulb, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const CommentGuideModal = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("good");

  if (!isOpen) return null;

  const goodExamples = [
    {
      icon: <Heart className="h-4 w-4 text-green-500" />,
      title: "Destaca lo positivo",
      example: "Me encantó cómo describiste la tormenta. Pude sentir la tensión y el peligro que vivía el protagonista."
    },
    {
      icon: <Lightbulb className="h-4 w-4 text-blue-500" />,
      title: "Sugiere mejoras amablemente",
      example: "La historia está muy buena. Quizás podrías desarrollar un poco más la relación entre los hermanos para que el final tenga más impacto emocional."
    },
    {
      icon: <MessageSquare className="h-4 w-4 text-purple-500" />,
      title: "Comenta elementos específicos",
      example: "El diálogo se siente muy natural. Especialmente me gustó la conversación en la cocina, muy realista."
    }
  ];

  const badExamples = [
    {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      title: "Críticas destructivas",
      example: "Esta historia es muy mala, no se entiende nada.",
      why: "No ayuda al autor a mejorar"
    },
    {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      title: "Comentarios despectivos",
      example: "Está claro que no sabes escribir, deberías dedicarte a otra cosa.",
      why: "Daña la confianza del escritor"
    },
    {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      title: "Comparaciones negativas",
      example: "Esta historia es mucho peor que las otras del concurso.",
      why: "Crea competencia tóxica"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center">
            💬 Guía para comentarios constructivos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Intro */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
              <strong>🌱 Nuestra comunidad está creciendo:</strong> Muchos escritores están empezando su viaje literario. 
              Tus comentarios pueden inspirar o desanimar. ¡Elige ser quien ayuda a florecer el talento!
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("good")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "good"
                  ? "bg-white dark:bg-dark-600 text-gray-900 dark:text-dark-100 shadow-sm"
                  : "text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Comentarios útiles
            </button>
            <button
              onClick={() => setActiveTab("bad")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "bad"
                  ? "bg-white dark:bg-dark-600 text-gray-900 dark:text-dark-100 shadow-sm"
                  : "text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100"
              }`}
            >
              <XCircle className="h-4 w-4 inline mr-1" />
              Evita estos comentarios
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "good" ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4">
                ✨ Ejemplos de comentarios que ayudan:
              </h3>
              {goodExamples.map((item, index) => (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {item.icon}
                    <span className="ml-2 font-medium text-green-800 dark:text-green-300">{item.title}</span>
                  </div>
                  <p className="text-green-700 dark:text-green-400 text-sm italic">
                    "{item.example}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-4">
                ❌ Comentarios que no ayudan:
              </h3>
              {badExamples.map((item, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {item.icon}
                    <span className="ml-2 font-medium text-red-800 dark:text-red-300">{item.title}</span>
                  </div>
                  <p className="text-red-700 dark:text-red-400 text-sm italic mb-2">
                    "{item.example}"
                  </p>
                  <p className="text-red-600 dark:text-red-500 text-xs">
                    Por qué evitarlo: {item.why}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
              💡 Consejos rápidos:
            </h4>
            <ul className="text-yellow-700 dark:text-yellow-400 text-sm space-y-1">
              <li>• Siempre menciona algo que te gustó</li>
              <li>• Si sugieres cambios, explica por qué podrían mejorar la historia</li>
              <li>• Usa "quizás podrías..." en lugar de "deberías..."</li>
              <li>• Recuerda que detrás de cada historia hay una persona aprendiendo</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-dark-600 p-6">
          <button
            onClick={onClose}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ¡Entendido! 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentGuideModal;