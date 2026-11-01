'use client';

import Image from 'next/image';
import clsx from 'clsx';
import type { PropertyCategory } from '@tro-oi/shared';

import { CATEGORIES } from '@/constants';

interface CategoryPickerProps {
  value?: PropertyCategory;
  onChange?: (value: PropertyCategory) => void;
}

/** Chọn loại hình bằng thẻ có icon — dùng làm control của Form.Item. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CATEGORIES.map((item) => {
        const isSelected = value === item.category;
        return (
          <button
            key={item.category}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange?.(item.category)}
            className={clsx(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 bg-white p-3 transition-all',
              isSelected
                ? 'border-[#16a6a3] bg-[#eafbf9] shadow-sm'
                : 'border-[#efefef] hover:border-[#b8d9d7]',
            )}
          >
            <Image src={item.icon} alt="" width={48} height={48} />
            <span className="text-sm font-semibold text-[#222]">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}
