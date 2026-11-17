import type { ConfigService } from '@nestjs/config';

import type { LlmPort } from '../../core/ports.js';
import { MockLlm } from './mock.js';
import { OpenAiCompatibleLlm } from './openai-compatible.js';

/** Chọn model theo AI_PROVIDER — chỗ duy nhất cần sửa khi thêm kiểu nhà cung cấp mới. */
export function createLlm(config: ConfigService): LlmPort {
  const provider = config.get<string>('AI_PROVIDER', 'mock');
  if (provider === 'mock') return new MockLlm();
  if (provider === 'openai-compatible') {
    return new OpenAiCompatibleLlm(
      config.getOrThrow<string>('AI_BASE_URL'),
      config.getOrThrow<string>('AI_MODEL'),
      config.get<string>('AI_API_KEY') || undefined,
    );
  }
  throw new Error(
    `AI_PROVIDER không hỗ trợ: ${provider} (mock | openai-compatible)`,
  );
}
