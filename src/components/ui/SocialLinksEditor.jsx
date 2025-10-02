import { Instagram, Twitter, Linkedin, Youtube, Music, Globe } from "lucide-react";

const SocialLinksEditor = ({ 
  value = {}, 
  onChange, 
  disabled = false 
}) => {
  const socialPlatforms = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      placeholder: '@usuario',
      prefix: 'https://instagram.com/',
      color: 'text-pink-500'
    },
    {
      key: 'twitter',
      label: 'Twitter/X',
      icon: Twitter,
      placeholder: '@usuario',
      prefix: 'https://twitter.com/',
      color: 'text-blue-500'
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      placeholder: 'usuario',
      prefix: 'https://linkedin.com/in/',
      color: 'text-blue-600'
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: Youtube,
      placeholder: '@canal',
      prefix: 'https://youtube.com/',
      color: 'text-red-500'
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: Music,
      placeholder: '@usuario',
      prefix: 'https://tiktok.com/',
      color: 'text-gray-900 dark:text-white'
    },
    {
      key: 'website',
      label: 'Sitio Web',
      icon: Globe,
      placeholder: 'https://misitio.com',
      prefix: '',
      color: 'text-green-600'
    }
  ];

  const handleInputChange = (platform, inputValue) => {
    const newValue = { ...value };
    
    if (inputValue.trim() === '') {
      // Si está vacío, remover la propiedad
      delete newValue[platform];
    } else {
      newValue[platform] = inputValue.trim();
    }
    
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <div key={platform.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Icon className={`w-4 h-4 ${platform.color}`} />
                {platform.label}
              </label>
              <div className="relative">
                {platform.prefix && platform.key !== 'website' && (
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                    {platform.prefix}
                  </span>
                )}
                <input
                  type={platform.key === 'website' ? 'url' : 'text'}
                  value={value[platform.key] || ''}
                  onChange={(e) => handleInputChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  disabled={disabled}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                    platform.prefix && platform.key !== 'website' ? 'pl-32' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {platform.key !== 'website' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Solo el nombre de usuario, sin {platform.prefix}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
        💡 <strong>Tip:</strong> Solo se mostrarán las redes sociales que completes. Deja en blanco las que no uses.
      </div>
    </div>
  );
};

export default SocialLinksEditor;