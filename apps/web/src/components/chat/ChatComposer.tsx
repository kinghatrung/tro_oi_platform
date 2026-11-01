'use client';

import { useCallback, useState, type KeyboardEvent } from 'react';
import { Button, Flex, Input } from 'antd';
import { SendHorizontal } from 'lucide-react';

interface ChatComposerProps {
  onSend: (content: string) => void;
  /** Nội dung điền sẵn (vd câu hỏi chọn từ trang chi tiết tin). */
  initialValue?: string;
  disabled?: boolean;
}

const MAX_LENGTH = 1000;

/** Ô soạn tin: Enter gửi, Shift+Enter xuống dòng. */
export function ChatComposer({ onSend, initialValue = '', disabled }: ChatComposerProps) {
  const [value, setValue] = useState(initialValue);
  const canSend = !disabled && value.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  }, [canSend, onSend, value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // isComposing: đang gõ tiếng Việt bằng bộ gõ (IME), Enter là để chốt chữ chứ không phải gửi
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Flex gap={8} align="end" className="border-t border-[#f0f0f0] p-3">
      <Input.TextArea
        aria-label="Nội dung tin nhắn"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        autoSize={{ minRows: 1, maxRows: 4 }}
        maxLength={MAX_LENGTH}
        placeholder="Nhập tin nhắn..."
        disabled={disabled}
        className="rounded-2xl!"
      />
      <Button
        type="primary"
        shape="circle"
        size="large"
        aria-label="Gửi"
        icon={<SendHorizontal size={18} />}
        disabled={!canSend}
        onClick={handleSend}
      />
    </Flex>
  );
}
