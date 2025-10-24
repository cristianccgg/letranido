import { Eye, Lock } from "lucide-react";

const PrivacyToggleSwitch = ({ 
  value, 
  onChange, 
  disabled = false, 
  label,
  description 
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-1">
          {value ? (
            <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            value 
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {value ? 'Público' : 'Privado'}
          </span>
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </div>
      </label>
    </div>
  );
};

export default PrivacyToggleSwitch;