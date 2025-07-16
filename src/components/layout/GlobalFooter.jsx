// components/layout/GlobalFooter.jsx - ACTUALIZADO PARA CONTEXTO UNIFICADO
import { useState } from "react";
import { Link } from "react-router-dom";
import { useGlobalApp } from "../../contexts/GlobalAppContext"; // ✅ Cambiado
import ContestActionButton from "../ui/ContestActionButton";
import ContestPhaseBadge from "../ui/ContestPhaseBadge";
import ContestRulesModal from "../forms/ContestRulesModal";

const GlobalFooter = () => {
  // ✅ TODO DESDE EL CONTEXTO GLOBAL UNIFICADO
  const { currentContest, currentContestPhase, isAuthenticated } =
    useGlobalApp(); // ✅ Cambiado de useAppState + useAuthStore

  const [showRulesModal, setShowRulesModal] = useState(false);

  // ✅ Función para obtener el contenido del CTA según la fase
  const getCTAContent = () => {
    if (!currentContest) {
      return {
        title: "¡Únete a Letranido!",
        subtitle: "Descubre una comunidad apasionada por la escritura creativa",
        description: "Pronto habrá nuevos concursos. ¡Mantente atento!",
        showButton: false,
      };
    }

    switch (currentContestPhase) {
      case "submission":
        return {
          title: `¿Listo para participar en ${currentContest.month}?`,
          subtitle: `${
            isAuthenticated
              ? "¡Es tu momento de brillar!"
              : "¡Comienza sin compromiso!"
          }`,
          description: isAuthenticated
            ? `Únete a ${
                currentContest.participants_count || 0
              } escritores que ya están compitiendo por la gloria literaria`
            : "Escribe tu historia libremente. Solo necesitas una cuenta al enviarla.",
          showButton: true,
        };
      case "voting":
        return {
          title: `¡Votación activa en el concurso de ${currentContest.month}!`,
          subtitle: isAuthenticated
            ? "Lee las historias y vota por tus favoritas"
            : "Regístrate para votar por las mejores historias",
          description: `${
            currentContest.participants_count || 0
          } escritores han participado. ¡Tu voto cuenta!`,
          showButton: true,
        };
      case "results":
        return {
          title: `¡Felicitaciones a todos los participantes de ${currentContest.month}!`,
          subtitle: "Gracias por hacer de este concurso un éxito",
          description:
            "¡Nos vemos en el próximo mes para una nueva aventura literaria!",
          showButton: false,
        };
      default:
        return {
          title: "¡Nuevo concurso disponible!",
          subtitle: "Descubre el desafío de este mes",
          description: "Únete a nuestra comunidad de escritores creativos",
          showButton: true,
        };
    }
  };

  const ctaContent = getCTAContent();

  return (
    <footer className="bg-gradient-to-r from-primary-600 to-accent-600 text-white">
      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Phase Badge */}
          {currentContest && (
            <div className="mb-6">
              <ContestPhaseBadge size="default" className="inline-block" />
            </div>
          )}

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {ctaContent.title}
          </h2>

          <p className="text-xl text-primary-100 mb-2">{ctaContent.subtitle}</p>

          <p className="text-primary-200 mb-8 max-w-2xl mx-auto">
            {ctaContent.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {ctaContent.showButton && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 w-full">
                <ContestActionButton
                  variant="primary"
                  size="large"
                  showDescription={false}
                  className="w-full"
                />
              </div>
            )}

            <button
              onClick={() => setShowRulesModal(true)}
              className="border-2 w-full border-white text-white hover:bg-white hover:text-primary-600 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Ver las reglas
            </button>
          </div>

          {/* Additional Info */}
          {currentContest && currentContestPhase === "submission" && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
              <p className="text-primary-100 text-sm">
                ⏰ Quedan{" "}
                <span className="font-bold">
                  {Math.max(
                    0,
                    Math.floor(
                      (new Date(currentContest.submission_deadline) -
                        new Date()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}
                </span>{" "}
                días para participar
              </p>
            </div>
          )}

          {currentContest && currentContestPhase === "voting" && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
              <p className="text-primary-100 text-sm">
                🗳️ Votación termina en{" "}
                <span className="font-bold">
                  {Math.max(
                    0,
                    Math.floor(
                      (new Date(currentContest.voting_deadline) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}
                </span>{" "}
                días
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t bg-black border-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Letranido</h3>
              <p className="text-primary-200 mb-4 max-w-md">
                Una comunidad donde la creatividad literaria no tiene límites.
                Únete a escritores apasionados de todo el mundo.
              </p>
              <div className="flex items-center gap-4 text-sm text-primary-300">
                <span>
                  📚 {currentContest?.participants_count || 0} escritores
                  activos
                </span>
                <span>🏆 Concursos mensuales</span>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold mb-4">Explora</h4>
              <ul className="space-y-2 text-primary-200">
                <li>
                  <Link
                    to="/contest/current"
                    className="hover:text-white transition-colors"
                  >
                    Concurso actual
                  </Link>
                </li>
                <li>
                  <Link
                    to="/history"
                    className="hover:text-white transition-colors"
                  >
                    Concursos pasados
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile/:userId"
                    className="hover:text-white transition-colors"
                  >
                    Mi perfil
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-4">Comunidad</h4>
              <ul className="space-y-2 text-primary-200">
                <li>
                  <Link
                    to="/community-guidelines"
                    className="hover:text-white transition-colors"
                  >
                    Guía de la comunidad
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terminos y condiciones
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-white transition-colors"
                  >
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookie-policy"
                    className="hover:text-white transition-colors"
                  >
                    Política de cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-primary-500 text-center text-primary-300">
            <p>
              &copy; 2024 Letranido. Hecho con ❤️ para la comunidad escritora.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ MODAL FUERA DE TODO - AL FINAL DEL FOOTER */}
      {showRulesModal && currentContest && (
        <ContestRulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          contest={{
            ...currentContest,
            endDate: new Date(
              currentContest.voting_deadline || currentContest.end_date
            ),
          }}
        />
      )}
    </footer>
  );
};

export default GlobalFooter;
// El componente usa el contexto correctamente y no causa el bug.
