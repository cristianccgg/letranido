import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Eye, Lock } from 'lucide-react';

const PrivacyToggle = ({ value, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { 
      value: true, 
      icon: Eye, 
      label: "Público", 
      description: "Visible en tu perfil público",
      color: "text-green-600"
    },
    { 
      value: false, 
      icon: Lock, 
      label: "Privado", 
      description: "Solo visible para ti",
      color: "text-gray-600"
    }
  ];

  const currentOption = options.find(opt => opt.value === value) || options[0];

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium
          transition-all duration-200 min-w-[100px] justify-between
          ${disabled 
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 cursor-pointer'
          }
          ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
        `}
      >
        <div className="flex items-center gap-1.5">
          <currentOption.icon className={`w-4 h-4 ${currentOption.color}`} />
          <span className={currentOption.color}>{currentOption.label}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {options.map((option) => {
            const IconComponent = option.icon;
            const isSelected = option.value === value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm
                  transition-colors duration-150
                  ${isSelected 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <IconComponent className={`w-4 h-4 ${option.color}`} />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary-600"></div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrivacyToggle;