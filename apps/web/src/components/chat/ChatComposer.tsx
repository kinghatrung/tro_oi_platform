'use client';

import Image from 'next/image';
import { useCallback, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { App, Button, Flex, Input, Spin } from 'antd';
import { ImagePlus, SendHorizontal, X } from 'lucide-react';

import { uploadImages } from '@/api/uploads';

interface ChatComposerProps {
  onSend: (content: string, images: string[]) => void;
  /** Gọi khi đang gõ (đã giãn: tối đa 1 lần / TYPING_GAP_MS). */
  onTyping?: () => void;
  /** Nội dung điền sẵn (vd câu hỏi chọn từ trang chi tiết tin). */
  initialValue?: string;
  disabled?: boolean;
}

const MAX_LENGTH = 1000;
/** Khớp MESSAGE_MAX_IMAGES (API) và giới hạn 5MB của /uploads. */
const MAX_IMAGES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TYPING_GAP_MS = 2500;

/** Ô soạn tin: Enter gửi, Shift+Enter xuống dòng; đính kèm tối đa 4 ảnh. */
export function ChatComposer({ onSend, onTyping, initialValue = '', disabled }: ChatComposerProps) {
  const { message } = App.useApp();
  const [value, setValue] = useState(initialValue);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);
  const canSend = !disabled && !isUploading && (value.trim().length > 0 || images.length > 0);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(value.trim(), images);
    setValue('');
    setImages([]);
  }, [canSend, images, onSend, value]);

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

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    const now = Date.now();
    if (onTyping && event.target.value && now - lastTypingRef.current > TYPING_GAP_MS) {
      lastTypingRef.current = now;
      onTyping();
    }
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = ''; // chọn lại cùng file vẫn kích hoạt onChange
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (files.length > room) message.warning(`Tối đa ${MAX_IMAGES} ảnh mỗi tin nhắn`);
    const accepted = files.slice(0, room).filter((file) => file.size <= MAX_FILE_BYTES);
    if (accepted.length < Math.min(files.length, room)) message.warning('Ảnh tối đa 5MB');
    if (accepted.length === 0) return;
    setIsUploading(true);
    try {
      const urls = await uploadImages(accepted);
      setImages((current) => [...current, ...urls].slice(0, MAX_IMAGES));
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-line p-3">
      {(images.length > 0 || isUploading) && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Ảnh đính kèm">
          {images.map((url) => (
            <li key={url} className="relative size-16 overflow-hidden rounded-lg bg-soft">
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              <button
                type="button"
                aria-label="Bỏ ảnh"
                onClick={() => setImages((current) => current.filter((item) => item !== url))}
                className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={12} />
              </button>
            </li>
          ))}
          {isUploading && (
            <li className="flex size-16 items-center justify-center rounded-lg bg-soft">
              <Spin size="small" />
            </li>
          )}
        </ul>
      )}
      <Flex gap={8} align="end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={handleFiles}
        />
        <Button
          shape="circle"
          size="large"
          aria-label="Gửi ảnh"
          icon={<ImagePlus size={18} />}
          disabled={disabled || isUploading || images.length >= MAX_IMAGES}
          onClick={() => fileInputRef.current?.click()}
        />
        <Input.TextArea
          aria-label="Nội dung tin nhắn"
          value={value}
          onChange={handleChange}
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
    </div>
  );
}
