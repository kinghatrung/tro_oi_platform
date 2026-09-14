'use client';

import { useState } from 'react';
import { Input } from 'antd';

interface FloatingInputProps {
  title?: string;
  className?: string;
}

/**
 * Floating label input component with animated label that moves up when focused or filled.
 * @param title - Label text to display
 * @param className - Additional CSS classes to apply to the input
 */
export function FloatingInput({ title, className }: FloatingInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const floating = focused || value.length > 0;

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className={className}
      />

      <label
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
