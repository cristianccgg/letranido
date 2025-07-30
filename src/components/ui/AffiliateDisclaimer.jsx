import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

const AffiliateDisclaimer = ({ type = "general", className = "" }) => {
  const disclaimers = {
    general: {
      icon: Info,
      title: "Aviso sobre Enlaces de Afiliado",
      content: "Letranido participa en programas de afiliados de Amazon y otras plataformas. Podemos recibir una pequeña comisión cuando realizas compras a través de nuestros enlaces, sin coste adicional para ti. Esto nos ayuda a mantener el contenido gratuito y de calidad."
    },
    amazon: {
      icon: AlertCircle,
      title: "Programa de Afiliados de Amazon",
      content: "Letranido es participante del Programa de Afiliados de Amazon EU, un programa de publicidad para afiliados diseñado para ofrecer a sitios web un modo de obtener comisiones por publicidad, publicitando e incluyendo enlaces a Amazon.es."
    },
    transparency: {
      icon: Info,
      title: "Transparencia y Honestidad",
      content: "Solo recomendamos productos y servicios que realmente hemos probado o que consideramos valiosos para escritores. Nuestras opiniones son independientes y no están influenciadas por las comisiones de afiliado."
    }
  };

  const disclaimer = disclaimers[type] || disclaimers.general;
  const IconComponent = disclaimer.icon;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <IconComponent className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">
            {disclaimer.title}
          </h4>
          <p className="text-blue-800 text-xs leading-relaxed">
            {disclaimer.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDisclaimer;