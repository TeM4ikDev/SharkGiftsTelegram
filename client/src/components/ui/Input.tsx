import { cn } from "@/utils/cn";

type Props = {
  placeholder: string;
  name: string;
  type?: string;
  error?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  className?: string;
  min?: number,
  max?: number,
  step?: number;
  isRequired?: boolean;
  disabled?: boolean;
  showClearButton?: boolean;
  showTopPlaceholder?: boolean;
};

export const Input = ({
  placeholder,
  name,
  type = 'text',
  step,
  error,
  value,
  min,
  max,
  onChange,
  onClear,
  className = '',
  isRequired = true,
  showClearButton = true,
  showTopPlaceholder = true
}: Props) => {
  const getInputMode = () => {
    if (type === 'number') {
      // Для числовых полей всегда используем decimal, чтобы разрешить ввод десятичных чисел
      return 'decimal';
    }
    return 'text';
  };

  // Для числовых полей, если step не указан, используем "any" чтобы разрешить любые десятичные числа
  const getStep = () => {
    if (type === 'number') {
      return step !== undefined ? step : 'any';
    }
    return step;
  };

  return (
    <div className="flex w-full h-min flex-col relative">
      <div className="relative group w-full font-bold">
        <input
          inputMode={getInputMode()}
          step={getStep()}
          type={type}
          min={min}
          max={max}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={showTopPlaceholder ? '' : placeholder}
          required={isRequired}
          className={cn(
            `w-full px-4 py-2 bg-app-card border border-app-border rounded-lg text-white
            focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
            hover:border-gray-500/50
            peer`,
            showTopPlaceholder ? "placeholder-transparent" : "",
            showClearButton && value ? "pr-10" : "",
            error ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50" : "",
            className
          )}
        />
        {showTopPlaceholder && (
          <span className={cn(
            `absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 
          transition-all duration-200 pointer-events-none`,
            value ? "-translate-y-7 text-xs text-cyan-400 px-1" : "",
            "group-hover:text-gray-300"
          )}>
            {placeholder}
          </span>
        )}

        {showClearButton && value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 
                     flex items-center justify-center text-gray-400 
                     hover:text-gray-200 transition-colors duration-200
                     rounded-full hover:bg-gray-600/50"
            title="Очистить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 px-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500"></span>
          {error}
        </p>
      )}
    </div>
  );
};