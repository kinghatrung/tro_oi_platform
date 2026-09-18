'use client';

import { useId, useState, type ChangeEventHandler } from 'react';
import { Input } from 'antd';

interface FloatingInputProps {
  title?: string;
  className?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

/**
 * Floating label input component with animated label that moves up when focused or filled.
 * @param title - Label text to display
 * @param className - Additional CSS classes to apply to the input
 */
export function FloatingInput({ title, className, value, onChange }: FloatingInputProps) {
  const inputId = useId();
  const [internalValue, setInternalValue] = useState('');
  const [focused, setFocused] = useState(false);
  const currentValue = value ?? internalValue;

  const floating = focused || currentValue.length > 0;

  return (
    <div className="relative">
      <Input
        id={inputId}
        value={currentValue}
        onChange={(event) => {
          if (value === undefined) setInternalValue(event.target.value);
          onChange?.(event);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={className}
      />

      <label
        htmlFor={inputId}
        className={`
            pointer-events-none absolute left-3 bg-white px-1
            transition-all duration-200
            ${
              floating
                ? 'top-0 -translate-y-1/2 text-xs text-[#16A6A3]'
                : 'top-1/2 -translate-y-1/2 text-sm text-[#8c8c8c]'
            }
          `}
      >
        {title}
      </label>
    </div>
  );
}
