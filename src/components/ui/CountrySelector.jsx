import { useState } from 'react';
import Select from 'react-select';

// Lista de países hispanohablantes y otros países relevantes
const countries = [
  // Países hispanohablantes principales
  { value: 'ES', label: '🇪🇸 España', searchTerms: ['españa', 'spain', 'espana'] },
  { value: 'MX', label: '🇲🇽 México', searchTerms: ['mexico', 'méxico'] },
  { value: 'AR', label: '🇦🇷 Argentina', searchTerms: ['argentina'] },
  { value: 'CO', label: '🇨🇴 Colombia', searchTerms: ['colombia'] },
  { value: 'PE', label: '🇵🇪 Perú', searchTerms: ['peru', 'perú'] },
  { value: 'VE', label: '🇻🇪 Venezuela', searchTerms: ['venezuela'] },
  { value: 'CL', label: '🇨🇱 Chile', searchTerms: ['chile'] },
  { value: 'EC', label: '🇪🇨 Ecuador', searchTerms: ['ecuador'] },
  { value: 'GT', label: '🇬🇹 Guatemala', searchTerms: ['guatemala'] },
  { value: 'CU', label: '🇨🇺 Cuba', searchTerms: ['cuba'] },
  { value: 'BO', label: '🇧🇴 Bolivia', searchTerms: ['bolivia'] },
  { value: 'DO', label: '🇩🇴 República Dominicana', searchTerms: ['republica dominicana', 'dominicana', 'rd'] },
  { value: 'HN', label: '🇭🇳 Honduras', searchTerms: ['honduras'] },
  { value: 'PY', label: '🇵🇾 Paraguay', searchTerms: ['paraguay'] },
  { value: 'NI', label: '🇳🇮 Nicaragua', searchTerms: ['nicaragua'] },
  { value: 'CR', label: '🇨🇷 Costa Rica', searchTerms: ['costa rica', 'costarica'] },
  { value: 'PA', label: '🇵🇦 Panamá', searchTerms: ['panama', 'panamá'] },
  { value: 'UY', label: '🇺🇾 Uruguay', searchTerms: ['uruguay'] },
  { value: 'SV', label: '🇸🇻 El Salvador', searchTerms: ['el salvador', 'salvador'] },
  { value: 'GQ', label: '🇬🇶 Guinea Ecuatorial', searchTerms: ['guinea ecuatorial', 'guinea'] },
  
  // Otros países importantes
  { value: 'US', label: '🇺🇸 Estados Unidos', searchTerms: ['estados unidos', 'usa', 'united states', 'eeuu'] },
  { value: 'BR', label: '🇧🇷 Brasil', searchTerms: ['brasil', 'brazil'] },
  { value: 'FR', label: '🇫🇷 Francia', searchTerms: ['francia', 'france'] },
  { value: 'IT', label: '🇮🇹 Italia', searchTerms: ['italia', 'italy'] },
  { value: 'DE', label: '🇩🇪 Alemania', searchTerms: ['alemania', 'germany', 'deutschland'] },
  { value: 'GB', label: '🇬🇧 Reino Unido', searchTerms: ['reino unido', 'uk', 'united kingdom', 'inglaterra'] },
  { value: 'CA', label: '🇨🇦 Canadá', searchTerms: ['canada', 'canadá'] },
  { value: 'PT', label: '🇵🇹 Portugal', searchTerms: ['portugal'] },
  { value: 'JP', label: '🇯🇵 Japón', searchTerms: ['japon', 'japón', 'japan'] },
  { value: 'KR', label: '🇰🇷 Corea del Sur', searchTerms: ['corea del sur', 'korea', 'south korea'] },
  { value: 'CN', label: '🇨🇳 China', searchTerms: ['china'] },
  { value: 'IN', label: '🇮🇳 India', searchTerms: ['india'] },
  { value: 'AU', label: '🇦🇺 Australia', searchTerms: ['australia'] },
  { value: 'NZ', label: '🇳🇿 Nueva Zelanda', searchTerms: ['nueva zelanda', 'new zealand'] },
  
  // Opción para otros países
  { value: 'OTHER', label: '🌍 Otro país', searchTerms: ['otro', 'other', 'otros'] }
];

const CountrySelector = ({ value, onChange, disabled = false, placeholder = "Buscar tu país..." }) => {
  const [inputValue, setInputValue] = useState('');

  // Función para filtrar países basado en la búsqueda
  const filterCountries = (inputValue, countriesList) => {
    if (!inputValue) return countriesList;
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    return countriesList.filter(country => {
      // Buscar en el label (nombre visible)
      const labelMatch = country.label.toLowerCase().includes(searchTerm);
      
      // Buscar en los términos de búsqueda adicionales
      const searchTermsMatch = country.searchTerms.some(term => 
        term.toLowerCase().includes(searchTerm)
      );
      
      return labelMatch || searchTermsMatch;
    });
  };

  // Encontrar la opción seleccionada (buscar por nombre limpio o por código)
  const selectedOption = countries.find(country => 
    country.value === value || 
    country.label.replace(/^..\s/, '') === value
  ) || null;

  // Estilos personalizados para react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#9ca3af'
      },
      backgroundColor: disabled ? '#f9fafb' : 'white',
      cursor: disabled ? 'not-allowed' : 'default'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#f3f4f6' 
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
      fontSize: '14px'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px'
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: '14px'
    }),
    input: (provided) => ({
      ...provided,
      fontSize: '14px'
    })
  };

  const handleChange = (selectedOption) => {
    if (selectedOption?.value === 'OTHER') {
      // Si selecciona "Otro país", permitir entrada libre
      const customCountry = prompt('¿De qué país eres? (Escribe el nombre completo)');
      if (customCountry && customCountry.trim()) {
        onChange(customCountry.trim());
      }
    } else {
      // Extraer solo el nombre del país sin emoji (remover cualquier emoji seguido de espacio)
      const countryName = selectedOption ? selectedOption.label.replace(/^..\s/, '') : '';
      onChange(countryName);
    }
  };

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={filterCountries(inputValue, countries)}
      onInputChange={setInputValue}
      inputValue={inputValue}
      placeholder={placeholder}
      noOptionsMessage={({ inputValue }) => 
        inputValue ? `No se encontró "${inputValue}"` : "Escribe para buscar..."
      }
      isDisabled={disabled}
      isClearable
      isSearchable
      styles={customStyles}
      className="text-sm"
      maxMenuHeight={200}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      filterOption={() => true} // Usamos nuestro filtro personalizado
    />
  );
};

export default CountrySelector;