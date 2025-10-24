import {
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  Globe,
  Facebook,
  ExternalLink,
} from "lucide-react";

const SocialLinksDisplay = ({
  socialLinks = {},
  showLabel = false,
  size = "md",
}) => {
  const socialPlatforms = {
    facebook: {
      label: "Facebook",
      icon: Facebook,
      prefix: "https://facebook.com/",
      color: "text-blue-500 hover:text-blue-700",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    },
    instagram: {
      label: "Instagram",
      icon: Instagram,
      prefix: "https://instagram.com/",
      color: "text-pink-500 hover:text-pink-600",
      bgColor: "hover:bg-pink-50 dark:hover:bg-pink-900/20",
    },
    twitter: {
      label: "Twitter/X",
      icon: Twitter,
      prefix: "https://twitter.com/",
      color: "text-blue-500 hover:text-blue-600",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    },
    linkedin: {
      label: "LinkedIn",
      icon: Linkedin,
      prefix: "https://linkedin.com/in/",
      color: "text-blue-600 hover:text-blue-700",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    },
    youtube: {
      label: "YouTube",
      icon: Youtube,
      prefix: "https://youtube.com/",
      color: "text-red-500 hover:text-red-600",
      bgColor: "hover:bg-red-50 dark:hover:bg-red-900/20",
    },
    tiktok: {
      label: "TikTok",
      icon: Music,
      prefix: "https://tiktok.com/",
      color:
        "text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300",
      bgColor: "hover:bg-gray-50 dark:hover:bg-gray-700",
    },
    website: {
      label: "Sitio Web",
      icon: Globe,
      prefix: "",
      color: "text-green-600 hover:text-green-700",
      bgColor: "hover:bg-green-50 dark:hover:bg-green-900/20",
    },
  };

  const sizeConfig = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buildUrl = (platform, username) => {
    const config = socialPlatforms[platform];
    if (!config) return "#";

    if (platform === "website") {
      // Para sitio web, usar la URL tal como está
      return username.startsWith("http") ? username : `https://${username}`;
    }

    // Para redes sociales, construir la URL
    return config.prefix + username.replace("@", "");
  };

  // Filtrar solo las redes sociales que tienen datos
  const availableLinks = Object.entries(socialLinks)
    .filter(([platform, username]) => username && username.trim() !== "")
    .map(([platform, username]) => ({
      platform,
      username: username.trim(),
      config: socialPlatforms[platform],
      url: buildUrl(platform, username.trim()),
    }))
    .filter((link) => link.config); // Solo plataformas conocidas

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {availableLinks.map(({ platform, username, config, url }) => {
        const Icon = config.icon;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
              ${config.color} ${config.bgColor}
              border border-gray-200 dark:border-gray-600
              hover:border-current hover:scale-105 hover:shadow-md
              group
            `}
            title={`${config.label}: ${username}`}
          >
            <Icon className={`${sizeConfig[size]} flex-shrink-0`} />
            {showLabel && (
              <>
                <span className="text-sm font-medium">{config.label}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </>
            )}
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinksDisplay;
