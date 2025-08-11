import { Link, Navigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Edit3,
  Save,
  X,
  Mail,
} from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import UserAvatar from "../components/ui/UserAvatar";
import ProfileTabs from "../components/profile/ProfileTabs";
import SEOHead from "../components/SEO/SEOHead";
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
    website: user?.website || ""
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // ✅ Cargar historias del usuario al entrar al perfil (solo una vez por usuario)
  useEffect(() => {
    if (user?.id && userStories.length === 0 && !userStoriesLoading) {
      console.log('📚 Cargando datos del usuario al entrar al perfil...');
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
      website: user?.website || ""
    });
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setEditedProfile({
      bio: user?.bio || "",
      location: user?.location || "",
      website: user?.website || ""
    });
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    setProfileUpdateLoading(true);
    try {
      const { supabase } = await import("../lib/supabase");
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          bio: editedProfile.bio?.trim() || null,
          location: editedProfile.location?.trim() || null,
          website: editedProfile.website?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
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

              <div className="text-sm text-gray-500 mb-4 text-center sm:text-left">
                Miembro desde{" "}
                {new Date(user?.created_at || Date.now()).toLocaleDateString(
                  "es-ES",
                  {
                    year: "numeric",
                    month: "long",
                  }
                )}
              </div>

              {/* Información adicional del perfil integrada */}
              {FEATURES.PREMIUM_PLANS && (
                <div className="space-y-3 mb-4">
                  {!isEditingProfile ? (
                    /* Modo vista */
                    <div className="space-y-3">
                      {/* Bio */}
                      {user?.bio && (
                        <div className="bg-white/50 dark:bg-dark-700/50 rounded-lg p-3">
                          <p className="text-gray-700 dark:text-dark-200 text-sm leading-relaxed text-center sm:text-left">
                            {user.bio}
                          </p>
                        </div>
                      )}
                      
                      {/* Location y Website en una fila */}
                      {(user?.location || user?.website) && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                          {user?.location && (
                            <div className="flex items-center justify-center sm:justify-start text-gray-600 dark:text-dark-400">
                              <span className="mr-2">📍</span>
                              <span>{user.location}</span>
                            </div>
                          )}
                          
                          {user?.website && (
                            <div className="flex items-center justify-center sm:justify-start text-gray-600 dark:text-dark-400">
                              <span className="mr-2">🔗</span>
                              <a 
                                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {user.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Botón de editar perfil */}
                      <button
                        onClick={handleStartEditProfile}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        {user?.bio || user?.location || user?.website ? 'Editar perfil' : 'Completar perfil'}
                      </button>
                    </div>
                  ) : (
                    /* Modo edición */
                    <div className="bg-white/80 dark:bg-dark-700/80 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Editar perfil</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={profileUpdateLoading}
                            className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors rounded-lg hover:bg-white/50"
                            title="Guardar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEditProfile}
                            disabled={profileUpdateLoading}
                            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors rounded-lg hover:bg-white/50"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Biografía
                        </label>
                        <textarea
                          value={editedProfile.bio}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Cuéntanos sobre ti como escritor..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                          rows={3}
                          disabled={profileUpdateLoading}
                        />
                      </div>
                      
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={editedProfile.location}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Tu ciudad, país..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                          disabled={profileUpdateLoading}
                        />
                      </div>
                      
                      {/* Website */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sitio web
                        </label>
                        <input
                          type="url"
                          value={editedProfile.website}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="tu-sitio.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                          disabled={profileUpdateLoading}
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-2">
                        💡 Estas características están disponibles para usuarios premium
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>



        {/* Profile Tabs - Carga bajo demanda */}
        <ProfileTabs 
          user={user} 
          votingStats={votingStats}
        />
      </div>
    </>
  );
};

export default UnifiedProfile;