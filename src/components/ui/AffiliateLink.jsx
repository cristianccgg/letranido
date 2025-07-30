import React from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

const AffiliateLink = ({ 
  href, 
  children, 
  platform = 'generic',
  price,
  className = '',
  showDisclaimer = true,
  ...props 
}) => {
  // Tracking click events for analytics
  const handleClick = () => {
    // Google Analytics event tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'affiliate_click', {
        affiliate_platform: platform,
        affiliate_url: href,
        value: price || 0
      });
    }

    // Console log for development
    console.log(`[Affiliate] Click tracked: ${platform} - ${href}`);
  };

  // Platform-specific styling
  const platformStyles = {
    amazon: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
    udemy: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
    coursera: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    masterclass: 'bg-black text-white border-gray-800 hover:bg-gray-800',
    scribd: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
    notion: 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100',
    generic: 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
  };

  const platformEmojis = {
    amazon: '📚',
    udemy: '🎓',
    coursera: '🏛️',
    masterclass: '⭐',
    scribd: '📖',
    notion: '📝',
    generic: '🔗'
  };

  return (
    <div className="affiliate-link-container">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className={`
          inline-flex items-center justify-between
          w-full p-4 rounded-lg border-2 
          transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
          ${platformStyles[platform] || platformStyles.generic}
          ${className}
        `}
        {...props}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{platformEmojis[platform] || platformEmojis.generic}</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">{children}</div>
            {price && (
              <div className="text-xs opacity-75 mt-1">
                Precio: {price}
              </div>
            )}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 opacity-60" />
      </a>
      
      {showDisclaimer && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>
            Enlaces de afiliado: Letranido puede recibir una comisión por compras realizadas a través de estos enlaces.
          </span>
        </div>
      )}
    </div>
  );
};

export default AffiliateLink;