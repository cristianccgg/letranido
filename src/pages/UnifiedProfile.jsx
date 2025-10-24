import { Link, Navigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { Edit3, Save, X, Mail, Eye, Calendar, MapPin } from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import UserAvatar from "../components/ui/UserAvatar";
import ProfileTabs from "../components/profile/ProfileTabs";
import SEOHead from "../components/SEO/SEOHead";
import PrivacyToggleSwitch from "../components/ui/PrivacyToggleSwitch";
import CountrySelector from "../components/ui/CountrySelector";
import SocialLinksEditor from "../components/ui/SocialLinksEditor";
import SocialLinksDisplay from "../components/ui/SocialLinksDisplay";
import ProfileCompletionPrompt from "../components/ui/ProfileCompletionPrompt";
import { FEATURES } from "../lib/config";

const UnifiedProfile = () => {
  const {
    user,
    userStories,
    userStoriesLoading,
    votingStats,
    votingStatsLoading,
    refreshUserData,
    updateDisplayName,
  } = useGlobalApp();

  // Estado para edición de nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.display_name || "");
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false);

  // Estado para edición de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    bio: user?.bio || "",
    location: user?.location || "",
    social_links: user?.social_links || {},
    show_bio: user?.show_bio ?? true,
    show_location: user?.show_location ?? true,
    show_social_links: user?.show_social_links ?? true,
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // ✅ Cargar historias del usuario al entrar al perfil (solo una vez por usuario)
  useEffect(() => {
    if (user?.id && userStories.length === 0 && !userStoriesLoading) {
      console.log("📚 Cargando datos del usuario al entrar al perfil...");
      refreshUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  // 🔍 Log para verificar datos en cada render
  console.log("🔍 UnifiedProfile render:", {
    user,
    userStories,
    userStoriesLoading,
    votingStats,
    votingStatsLoading,
  });

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

  // ✅ FUNCIONES PARA EDITAR PERFIL
  const handleStartEditProfile = () => {
    setEditedProfile({
      bio: user?.bio || "",
      location: user?.location || "",
      social_links: user?.social_links || {},
      show_bio: user?.show_bio ?? true,
      show_location: user?.show_location ?? true,
      show_social_links: user?.show_social_links ?? true,
    });
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setEditedProfile({
      bio: user?.bio || "",
      location: user?.location || "",
      social_links: user?.social_links || {},
      show_bio: user?.show_bio ?? true,
      show_location: user?.show_location ?? true,
      show_social_links: user?.show_social_links ?? true,
    });
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    setProfileUpdateLoading(true);
    try {
      const { supabase } = await import("../lib/supabase");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          bio: editedProfile.bio?.trim() || null,
          location: editedProfile.location?.trim() || null,
          social_links: editedProfile.social_links || {},
          show_bio: editedProfile.show_bio,
          show_location: editedProfile.show_location,
          show_social_links: editedProfile.show_social_links,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        alert("❌ Error al actualizar el perfil: " + error.message);
        return;
      }

      alert("✅ Perfil actualizado exitosamente");
      setIsEditingProfile(false);
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Error inesperado al actualizar el perfil");
    } finally {
      setProfileUpdateLoading(false);
    }
  };

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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEOHead
        title="Mi Perfil - Letranido"
        description="Gestiona tu perfil, visualiza tus historias y estadísticas en Letranido."
        keywords="perfil usuario, escritor, historias, estadísticas"
        url="/profile"
        canonicalUrl="https://letranido.com/profile"
      />
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* Profile Header - Estilo con gradiente */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-2xl shadow-lg overflow-hidden">
          {/* Patrón decorativo sutil */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"></div>
          </div>

          <div className="relative px-6 sm:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Avatar */}
              <div className="flex justify-center sm:justify-start flex-shrink-0">
                <div className="ring-4 ring-white/30 rounded-full">
                  <UserAvatar user={user} size="xl" />
                </div>
              </div>

              {/* Información del usuario */}
              <div className="flex-1 text-center sm:text-left">
                {!isEditingName ? (
                  <div className="flex justify-center sm:justify-start items-center gap-2 sm:gap-3 mb-3">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                      {user?.name || user?.display_name}
                    </h1>
                    <button
                      onClick={handleStartEditName}
                      className="p-2 cursor-pointer text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-lg  w-fit"
                      title="Editar nombre"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full mb-3">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl sm:text-3xl font-bold text-gray-900 bg-white border border-white/30 rounded-lg px-3 py-2 flex-1 text-center sm:text-left focus:ring-2 focus:ring-white focus:border-white outline-none"
                      placeholder="Tu nombre de escritor"
                      disabled={nameUpdateLoading}
                    />
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <button
                        onClick={handleSaveDisplayName}
                        disabled={nameUpdateLoading}
                        className="p-2 text-white hover:bg-white/20 disabled:opacity-50 transition-colors rounded-lg bg-white/10"
                        title="Guardar"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={nameUpdateLoading}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors rounded-lg"
                        title="Cancelar"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensaje informativo cuando está editando */}
                {isEditingName && (
                  <div className="text-sm text-white/90 mb-3 bg-white/10 border border-white/20 rounded-lg p-3">
                    💡 Este nombre aparecerá en todas tus historias y
                    comentarios
                  </div>
                )}

                {/* Email e información adicional */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Miembro desde{" "}
                      {new Date(
                        user?.created_at || Date.now()
                      ).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Profile Info Display */}
                {user?.bio && (
                  <p className="text-white/90 mb-4 leading-relaxed">
                    {user.bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80 mb-4">
                  {user?.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user?.social_links &&
                    Object.keys(user.social_links).length > 0 && (
                      <div className="flex items-center [&_a]:!text-white [&_a]:!border-white/30 [&_a:hover]:!border-white/50 [&_a:hover]:!bg-white/10 [&_a]:shadow-sm [&_svg]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                        <SocialLinksDisplay
                          socialLinks={user.social_links}
                          size="sm"
                        />
                      </div>
                    )}
                </div>

                {/* Botones de perfil público */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={handleStartEditProfile}
                    data-edit-profile-button
                    className="inline-flex cursor-pointer items-center text-sm text-white hover:text-white font-medium bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {user?.bio ||
                    user?.location ||
                    (user?.social_links &&
                      Object.keys(user.social_links).length > 0)
                      ? "Editar perfil público"
                      : "Completar perfil público"}
                  </button>
                  <Link
                    to={`/author/${user.id}`}
                    className="inline-flex cursor-pointer items-center text-sm text-white/90 hover:text-white font-medium border border-white/30 hover:border-white/50 rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver perfil público
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Section - Diseño mejorado */}
        {isEditingProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary-600" />
                Editar perfil público
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileUpdateLoading}
                  className="cursor-pointer flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition-colors rounded-lg px-4 py-2 font-medium"
                  title="Guardar"
                >
                  Guardar
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEditProfile}
                  disabled={profileUpdateLoading}
                  className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors rounded-lg px-4 py-2 font-medium"
                  title="Cancelar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                💡 Usa los controles de privacidad para elegir qué información
                mostrar en tu perfil público
              </div>

              {/* Bio */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <PrivacyToggleSwitch
                  value={editedProfile.show_bio}
                  onChange={(show) =>
                    setEditedProfile((prev) => ({ ...prev, show_bio: show }))
                  }
                  disabled={profileUpdateLoading}
                  label="Biografía"
                  description="Mostrar tu biografía en el perfil público"
                />
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Cuéntanos sobre ti como escritor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  rows={3}
                  disabled={profileUpdateLoading}
                />
                {!editedProfile.show_bio && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    🔒 Solo tú puedes ver esta información
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <PrivacyToggleSwitch
                  value={editedProfile.show_location}
                  onChange={(show) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      show_location: show,
                    }))
                  }
                  disabled={profileUpdateLoading}
                  label="País"
                  description="Mostrar tu país en el perfil público"
                />
                <CountrySelector
                  value={editedProfile.location}
                  onChange={(country) =>
                    setEditedProfile((prev) => ({ ...prev, location: country }))
                  }
                  disabled={profileUpdateLoading}
                  placeholder="Buscar tu país..."
                />
                {!editedProfile.show_location && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    🔒 Solo tú puedes ver esta información
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  💡 Esto nos ayuda a entender mejor a nuestra comunidad global
                </div>
              </div>

              {/* Social Links */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <PrivacyToggleSwitch
                  value={editedProfile.show_social_links}
                  onChange={(show) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      show_social_links: show,
                    }))
                  }
                  disabled={profileUpdateLoading}
                  label="Redes sociales"
                  description="Mostrar enlaces a tus redes sociales y sitio web"
                />
                <SocialLinksEditor
                  value={editedProfile.social_links}
                  onChange={(links) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      social_links: links,
                    }))
                  }
                  disabled={profileUpdateLoading}
                />
                {!editedProfile.show_social_links && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    🔒 Solo tú puedes ver esta información
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Completion Prompt - Solo si no está editando */}
        {!isEditingProfile && (
          <ProfileCompletionPrompt user={user} />
        )}

        {/* Profile Tabs - Carga bajo demanda */}
        <ProfileTabs user={user} votingStats={votingStats} />
      </div>
    </>
  );
};

export default UnifiedProfile;
