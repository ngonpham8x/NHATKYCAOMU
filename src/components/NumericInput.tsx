import React from 'react';
import { X } from 'lucide-react';

export interface NumericInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  decimal?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
  'aria-label'?: string;
  showClear?: boolean;
}

/**
 * Clean, rock-solid numeric input component supporting desktop keyboards (Vietnamese IME / Telex / VNI),
 * mobile touch keypads, comma/dot decimals, and clear button.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  value,
  onChange,
  decimal = false,
  placeholder,
  className = '',
  disabled = false,
  autoFocus = false,
  name,
  'aria-label': ariaLabel,
  showClear = false,
}) => {
  const safeValue = value !== undefined && value !== null ? String(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) {
      onChange('');
      return;
    }

    if (decimal) {
      // Allow numbers and at most 1 decimal separator (. or ,)
      // Replace any invalid characters (keep digits, dot, comma)
      const sanitized = rawVal.replace(/[^0-9.,]/g, '');
      const parts = sanitized.split(/[.,]/);
      if (parts.length > 2) {
        // Keep the first separator used, join the rest
        const firstSep = sanitized.includes(',') && sanitized.indexOf(',') < sanitized.indexOf('.') ? ',' : (sanitized.includes('.') ? '.' : ',');
        const result = parts[0] + firstSep + parts.slice(1).join('');
        onChange(result);
      } else {
        onChange(sanitized);
      }
    } else {
      // For whole numbers (prices, days), allow only digits
      // If user pasted/typed thousand separators like 18.000 or 18,000, strip non-digits
      const sanitized = rawVal.replace(/\D/g, '');
      onChange(sanitized);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        id={id}
        name={name}
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={safeValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} ${showClear && safeValue ? 'pr-8' : ''}`}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      {showClear && Boolean(safeValue) && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center cursor-pointer transition z-10"
          title="Xóa ô nhập"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};


