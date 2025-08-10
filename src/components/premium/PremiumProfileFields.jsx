import { useState } from 'react';
import { MapPin, Globe, Edit3, Crown, Lock } from 'lucide-react';
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures';
import { FEATURES } from '../../lib/config';

const PremiumProfileFields = ({ 
  user, 
  isOwnProfile = false, 
  onUpdateProfile 
}) => {
  const { 
    canEditBio, 
    canSetLocation, 
    canAddWebsite, 
    isPremium,
    getUpgradeMessage 
  } = usePremiumFeatures();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  });

  // Solo mostrar si las funciones premium están habilitadas
  if (!FEATURES.PREMIUM_PLANS) {
    return null;
  }

  const handleSave = async () => {
    if (onUpdateProfile) {
      await onUpdateProfile(formData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || ''
    });
    setIsEditing(false);
  };

  const PremiumField = ({ 
    icon, 
    label, 
    value, 
    placeholder, 
    canEdit, 
    fieldName, 
    type = "text" 
  }) => {
    const Icon = icon;
    const hasValue = value && value.trim();
    const showUpgrade = !canEdit && isOwnProfile;

    if (!hasValue && !isOwnProfile) {
      return null; // No mostrar campos vacíos en perfiles ajenos
    }

    return (
      <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <Icon className={`w-5 h-5 mt-0.5 ${canEdit ? 'text-blue-500' : 'text-gray-400'}`} />
        
        <div className="flex-1">
          {isEditing && canEdit ? (
            // Modo edición
            type === 'textarea' ? (
              <textarea
                value={formData[fieldName]}
                onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                placeholder={placeholder}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
            ) : (
              <input
                type={type === 'url' ? 'url' : 'text'}
                value={formData[fieldName]}
                onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                placeholder={placeholder}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            )
          ) : (
            // Modo vista
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {label}
                {isPremium() && <Crown className="w-4 h-4 inline ml-2 text-yellow-500" />}
              </div>
              
              {hasValue ? (
                type === 'url' ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {value}
                  </p>
                )
              ) : showUpgrade ? (
                <div className="flex items-center space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border-l-4 border-amber-400">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    {getUpgradeMessage(fieldName)}
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  {placeholder}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header con botón de editar */}
      {isOwnProfile && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            Perfil 
            {isPremium() && <Crown className="w-5 h-5 ml-2 text-yellow-500" />}
          </h3>
          
          {canEditBio() && (
            <div className="space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Campos premium */}
      <div className="space-y-3">
        <PremiumField
          icon={Edit3}
          label="Biografía"
          value={user?.bio}
          placeholder="Cuéntanos sobre ti como escritor..."
          canEdit={canEditBio()}
          fieldName="bio"
          type="textarea"
        />
        
        <PremiumField
          icon={MapPin}
          label="Ubicación"
          value={user?.location}
          placeholder="Ciudad, País"
          canEdit={canSetLocation()}
          fieldName="location"
        />
        
        <PremiumField
          icon={Globe}
          label="Website"
          value={user?.website}
          placeholder="https://tu-website.com"
          canEdit={canAddWebsite()}
          fieldName="website"
          type="url"
        />
      </div>

      {/* Mensaje de upgrade si no es premium */}
      {isOwnProfile && !isPremium() && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <Crown className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-400">
              Perfil Profesional
            </h4>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Personaliza tu perfil con biografía, ubicación y website. 
            Conecta con otros escritores y muestra tu trabajo profesional.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Ver Planes Premium
          </button>
        </div>
      )}
    </div>
  );
};

export default PremiumProfileFields;