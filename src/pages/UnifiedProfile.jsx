import { Link, Navigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  PenTool,
  Trophy,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  Heart,
  Eye,
  Users,
  User,
  Edit3,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Trash2,
  Save,
  X,
  Mail,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import ContestActionButton from "../components/ui/ContestActionButton";
import UserAvatar from "../components/ui/UserAvatar";
import UserBadgesSection from "../components/ui/UserBadgesSection";
import PremiumProfileFields from "../components/premium/PremiumProfileFields";
import SEOHead from "../components/SEO/SEOHead";
import { FEATURES } from "../lib/config";

const UnifiedProfile = () => {
  // ✅ TODO DESDE EL CONTEXTO UNIFICADO - sin hooks múltiples
  const {
    user,
    currentContest,
    currentContestPhase,
    userStories,
    userStoriesLoading,
    votingStats,
    votingStatsLoading,
    deleteUserStory,
    getContestPhase,
    updateDisplayName,
  } = useGlobalApp();

  // Estado para edición de nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.display_name || "");
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false);

  // 🔍 Log para verificar datos en cada render
  console.log("🔍 UnifiedProfile render:", {
    user,
    userStories,
    userStoriesLoading,
    votingStats,
    votingStatsLoading,
    currentContest,
    currentContestPhase,
  });

  // ✅ VERIFICACIÓN DE PARTICIPACIÓN DIRECTA - sin estado local
  const hasUserParticipated =
    currentContest && userStories.length > 0
      ? userStories.some((story) => story.contest_id === currentContest.id)
      : false;

  // ✅ FUNCIÓN PARA ELIMINAR HISTORIA
  const handleDeleteStory = async (storyId, storyTitle) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar la historia "${storyTitle}"?\n\nEsta acción no se puede deshacer. Después de eliminarla, podrás escribir una nueva historia para el concurso.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await deleteUserStory(storyId);

      if (result.success) {
        alert(
          "✅ Historia eliminada exitosamente. Ahora puedes escribir una nueva historia para el concurso."
        );
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (err) {
      alert("❌ Error inesperado al eliminar la historia");
      console.error("Error deleting story:", err);
    }
  };

  // ✅ FUNCIONES PARA EDITAR NOMBRE
  const handleStartEditName = () => {
    setEditedName(user?.display_name || "");
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setEditedName(user?.display_name || "");
    setIsEditingName(false);
  };

  const handleSaveDisplayName = async () => {
    if (!editedName.trim()) {
      alert("❌ El nombre no puede estar vacío");
      return;
    }

    if (editedName.trim() === user?.display_name) {
      // No hay cambios
      setIsEditingName(false);
      return;
    }

    setNameUpdateLoading(true);
    try {
      const result = await updateDisplayName(editedName);

      if (result.success) {
        alert("✅ Nombre actualizado exitosamente");
        setIsEditingName(false);
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (err) {
      alert("❌ Error inesperado al actualizar el nombre");
      console.error("Error updating display name:", err);
    } finally {
      setNameUpdateLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      // Importar supabase aquí para actualizar perfil
      const { supabase } = await import("../lib/supabase");
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          bio: profileData.bio?.trim() || null,
          location: profileData.location?.trim() || null,
          website: profileData.website?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert("❌ Error al actualizar el perfil: " + error.message);
        return false;
      }

      alert("✅ Perfil actualizado exitosamente");
      
      // Recargar la página para mostrar cambios
      window.location.reload();
      
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Error inesperado al actualizar el perfil");
      return false;
    }
  };

  // ✅ ESTADÍSTICAS CALCULADAS - optimizadas con useMemo
  const { totalLikes, totalViews, totalWins } = useMemo(() => {
    return {
      totalLikes: userStories.reduce(
        (total, story) => total + (story.likes_count || 0),
        0
      ),
      totalViews: userStories.reduce(
        (total, story) => total + (story.views_count || 0),
        0
      ),
      totalWins: userStories.filter((story) => story.is_winner).length,
    };
  }, [userStories]);

  // ✅ LOADING SIMPLIFICADO - Solo mostrar loading si realmente está cargando Y hay usuario
  const showLoading = userStoriesLoading && user;

  if (showLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a home para evitar errores de redirect en bots
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEOHead
        title={
          user?.display_name ? `Perfil de ${user.display_name}` : "Mi Perfil"
        }
        description={
          user?.bio ||
          `Perfil de escritor en Letranido. Descubre las historias y participaciones de ${user?.display_name || "este usuario"} en nuestra comunidad de escritura creativa.`
        }
        keywords="perfil escritor, historias usuario, comunidad escritura, letranido"
        url="/profile"
        canonicalUrl="https://letranido.com/profile"
      />
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-dark-800/95 dark:to-dark-800/95 rounded-lg p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <UserAvatar user={user} size="xl" />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                {!isEditingName ? (
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-100">
                      {user?.name || user?.display_name}
                    </h1>
                    <button
                      onClick={handleStartEditName}
                      className="p-2 text-gray-500 dark:text-dark-300 hover:text-gray-700 transition-colors rounded-lg hover:bg-white/50"
                      title="Editar nombre"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl sm:text-3xl font-bold text-gray-900 bg-white/80 border border-gray-300 rounded-lg px-3 py-2 flex-1 text-center sm:text-left focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      placeholder="Tu nombre de escritor"
                      disabled={nameUpdateLoading}
                    />
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <button
                        onClick={handleSaveDisplayName}
                        disabled={nameUpdateLoading}
                        className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors rounded-lg hover:bg-white/50"
                        title="Guardar"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={nameUpdateLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors rounded-lg hover:bg-white/50"
                        title="Cancelar"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje informativo cuando está editando */}
              {isEditingName && (
                <div className="text-sm text-gray-600 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                  💡 Este nombre aparecerá en todas tus historias y comentarios
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                <p className="text-gray-600 dark:text-dark-400 text-center sm:text-left break-all sm:break-normal">
                  {user?.email}
                </p>
                <Link
                  to="/preferences"
                  className="inline-flex items-center justify-center sm:justify-start text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Configurar preferencias
                </Link>
              </div>

              <div className="text-sm text-gray-500 mb-6 text-center sm:text-left">
                Miembro desde{" "}
                {new Date(user?.created_at || Date.now()).toLocaleDateString(
                  "es-ES",
                  {
                    year: "numeric",
                    month: "long",
                  }
                )}
              </div>

              {/* Quick Stats - Datos en tiempo real */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-dark-700 rounded-lg p-3 sm:p-4 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userStories.length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-dark-400">
                    Historias
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-700 rounded-lg p-3 sm:p-4 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {totalLikes}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-dark-400">
                    Likes recibidos
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-700 rounded-lg p-3 sm:p-4 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {votingStatsLoading ? "..." : votingStats.userVotesCount}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-dark-400">
                    Votos dados
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-700 rounded-lg p-3 sm:p-4 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {totalViews}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-dark-400">
                    Lecturas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <UserBadgesSection
          userId={user?.id}
          userName={user?.name || user?.display_name || "Usuario"}
        />

        {/* Premium Profile Fields */}
        {FEATURES.PREMIUM_PLANS && (
          <PremiumProfileFields 
            user={user}
            isOwnProfile={true}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Contest Status */}
            {currentContest && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-300 flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-primary-600" />
                    Concurso {currentContest.month}
                  </h2>
                  <div className="flex items-center text-gray-500 dark:text-dark-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {currentContestPhase === "submission"
                      ? "Envíos abiertos"
                      : currentContestPhase === "voting"
                        ? "En votación"
                        : "Finalizado"}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-300 mb-2">
                  {currentContest.title}
                </h3>

                {/* Participation Status - En tiempo real */}
                {userStoriesLoading ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="animate-pulse flex items-center">
                      <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                    </div>
                  </div>
                ) : hasUserParticipated ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-green-800">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        ¡Ya participaste en este concurso!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Tu historia fue enviada exitosamente.
                      {currentContestPhase === "voting" &&
                        " ¡Ahora puedes votar por otras historias!"}
                      {currentContestPhase === "results" &&
                        " Puedes ver los resultados finales."}
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-blue-800">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        {currentContestPhase === "results"
                          ? "Este concurso ya terminó"
                          : "Aún no participaste en este concurso"}
                      </span>
                    </div>
                    {currentContestPhase !== "results" && (
                      <p className="text-blue-700 text-sm mt-1">
                        ¡Es tu oportunidad de brillar! Escribe una historia
                        increíble.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-dark-400">
                  <span>{currentContest.participants_count} participantes</span>
                  <Link
                    to="/contest/current"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-400 font-medium"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Stories */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-400 mb-6">
                Mis historias ({userStories.length})
              </h2>

              {userStories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <PenTool className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-dark-300 mb-2">
                    Aún no has escrito ninguna historia
                  </h3>
                  <p className="text-gray-600 dark:text-dark-400 mb-4">
                    ¡Es el momento perfecto para empezar tu aventura literaria!
                  </p>
                  {!hasUserParticipated &&
                    currentContestPhase !== "results" && (
                      <Link to="/write" className="btn-primary">
                        Escribir mi primera historia
                      </Link>
                    )}
                </div>
              ) : (
                <div className="space-y-4">
                  {userStories.map((story) => (
                    <article
                      key={story.id}
                      className="border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {story.contests?.title || "Concurso"}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {story.title}
                      </h3>

                      <div
                        className="text-gray-600 mb-3 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: story.excerpt || "",
                        }}
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {new Date(story.created_at).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                          <span className="flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            {story.likes_count || 0}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {story.views_count || 0}
                          </span>
                          <span>{story.word_count || 0} palabras</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/story/${story.id}`}
                            className="text-primary-600 hover:scale-110 hover:text-primary-700 font-medium text-sm"
                          >
                            Leer →
                          </Link>

                          {/* Botón editar - solo durante período de envío */}
                          {(() => {
                            const contestPhase = story.contests
                              ? getContestPhase(story.contests)
                              : "no contests";
                            const canEdit = contestPhase === "submission";

                            return canEdit;
                          })() && (
                            <Link
                              to={`/write/${story.contest_id}?edit=${story.id}`}
                              className="text-blue-600 hover:scale-110 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Editar historia"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          )}

                          {/* Botón eliminar - solo durante período de envío O si es admin */}
                          {(() => {
                            const contestPhase = story.contests
                              ? getContestPhase(story.contests)
                              : "no contests";
                            const canDelete =
                              contestPhase === "submission" || user?.is_admin;

                            // DEBUG TEMPORAL: Ver fechas y fase
                            console.log("🔍 DEBUG FASE:", {
                              storyId: story.id,
                              now: new Date().toISOString(),
                              submissionDeadline:
                                story.contests?.submission_deadline,
                              votingDeadline: story.contests?.voting_deadline,
                              contestPhase,
                              isAdmin: user?.is_admin,
                              canDelete,
                            });

                            return canDelete;
                          })() && (
                            <button
                              onClick={() =>
                                handleDeleteStory(story.id, story.title)
                              }
                              className="text-red-600 cursor-pointer hover:scale-110 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar historia"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-dark-300 mb-4">
                Acciones disponibles
              </h3>
              <div className="space-y-3">
                <ContestActionButton
                  variant="outline"
                  size="default"
                  className="w-full"
                  showDescription={true}
                />

                <Link
                  to="/contest/current"
                  className="w-full flex items-center p-3 rounded-lg transition-colors text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">Ver concurso actual</div>
                    <div className="text-xs opacity-75">
                      {currentContest?.participants_count || 0} participantes
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Voting Activity */}
            {!votingStatsLoading && votingStats.userVotesCount > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Actividad de votación
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total votos dados:</span>
                    <span className="font-medium text-red-600">
                      {votingStats.userVotesCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">En concurso actual:</span>
                    <span className="font-medium text-blue-600">
                      {votingStats.currentContestVotes}
                    </span>
                  </div>
                  {currentContest?.status === "voting" &&
                    votingStats.currentContestVotes === 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          💡 ¡Aún no has votado en el concurso actual!
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Contest Info */}
            {currentContest && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-dark-300 mb-3">
                  Información del concurso
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-300 ">
                      Categoría:
                    </span>
                    <span className="font-medium">
                      {currentContest.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-300 ">
                      Participantes:
                    </span>
                    <span className="font-medium">
                      {currentContest.participants_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-dark-300 ">
                      Tu estado:
                    </span>
                    <span
                      className={`font-medium ${
                        hasUserParticipated
                          ? "text-green-600"
                          : "text-gray-600 dark:text-dark-400"
                      }`}
                    >
                      {hasUserParticipated ? "Participando" : "No participando"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UnifiedProfile;
// El componente usa el contexto correctamente y no causa el bug.
