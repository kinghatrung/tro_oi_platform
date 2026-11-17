import { jest } from '@jest/globals';

import { parsePriceRange } from './mock.js';
import { OpenAiCompatibleLlm } from './openai-compatible.js';

describe('OpenAiCompatibleLlm', () => {
  afterEach(() => jest.restoreAllMocks());

  it('gửi system + lịch sử + công cụ đúng định dạng, đọc tool_calls (JSON hỏng giữ nguyên chuỗi)', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: 't1',
                    function: { name: 'tim_tin', arguments: '{"maxPrice":4}' },
                    extra_content: { google: { thought_signature: 'sig' } },
                  },
                  { id: '', function: { name: 'tim_tin', arguments: '{hỏng' } },
                ],
              },
            },
          ],
        }),
      ),
    );
    const llm = new OpenAiCompatibleLlm(
      'https://llm.example/v1/',
      'model-x',
      'key',
    );
    const turn = await llm.complete({
      system: 'SYS',
      messages: [
        { role: 'user', content: 'hi' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'a',
              name: 'tim_tin',
              args: { x: 1 },
              extra: { google: { thought_signature: 'old' } },
            },
          ],
        },
        {
          role: 'tool',
          toolCallId: 'a',
          name: 'tim_tin',
          content: '{"total":0}',
        },
      ],
      tools: [
        { name: 'tim_tin', description: 'd', parameters: { type: 'object' } },
      ],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://llm.example/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe(
      'Bearer key',
    );
    const body = JSON.parse(init.body as string);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'SYS' });
    expect(body.messages[2].tool_calls[0].function.arguments).toBe('{"x":1}');
    // Gemini: thought_signature của lượt trước phải gửi trả nguyên vẹn
    expect(body.messages[2].tool_calls[0].extra_content).toEqual({
      google: { thought_signature: 'old' },
    });
    expect(body.messages[3]).toEqual({
      role: 'tool',
      tool_call_id: 'a',
      content: '{"total":0}',
    });
    expect(body.tools[0]).toEqual({
      type: 'function',
      function: {
        name: 'tim_tin',
        description: 'd',
        parameters: { type: 'object' },
      },
    });
    expect(turn.toolCalls).toEqual([
      {
        id: 't1',
        name: 'tim_tin',
        args: { maxPrice: 4 },
        extra: { google: { thought_signature: 'sig' } },
      },
      { id: 'call_1', name: 'tim_tin', args: '{hỏng' },
    ]);
  });

  it('nhà cung cấp trả lỗi → ném lỗi kèm mã', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'quota' } }), {
        status: 429,
      }),
    );
    await expect(
      new OpenAiCompatibleLlm('https://x', 'm').complete({
        system: '',
        messages: [],
        tools: [],
      }),
    ).rejects.toThrow('Model m lỗi 429: quota');
  });
});

describe('OpenAiCompatibleLlm — nhiều model dự phòng', () => {
  afterEach(() => jest.restoreAllMocks());

  const geminiError = (code: number, message: string) =>
    // Gemini trả lỗi dạng mảng
    new Response(JSON.stringify([{ error: { code, message } }]), {
      status: code,
    });

  it('model đầu quá tải (503) / không còn (404) → thử model sau', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(geminiError(503, 'high demand'))
      .mockResolvedValueOnce(geminiError(404, 'gone'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: 'OK' } }] }),
        ),
      );
    const llm = new OpenAiCompatibleLlm('https://x', 'a, b ,c');
    const turn = await llm.complete({ system: '', messages: [], tools: [] });

    expect(turn.text).toBe('OK');
    const models = fetchMock.mock.calls.map(
      ([, init]) => JSON.parse((init as RequestInit).body as string).model,
    );
    expect(models).toEqual(['a', 'b', 'c']);
    expect(llm.name).toBe('openai-compatible:a,b,c');
  });

  it('model đầu hết giờ → thử model sau; người dùng huỷ → dừng hẳn', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: 'OK' } }] }),
        ),
      );
    const llm = new OpenAiCompatibleLlm('https://x', 'a,b');
    await expect(
      llm.complete({ system: '', messages: [], tools: [] }),
    ).resolves.toMatchObject({ text: 'OK' });

    const aborted = new AbortController();
    aborted.abort();
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new DOMException('aborted', 'AbortError'));
    await expect(
      llm.complete({
        system: '',
        messages: [],
        tools: [],
        signal: aborted.signal,
      }),
    ).rejects.toThrow('aborted');
  });

  it('lỗi do yêu cầu (400/401) → dừng ngay, báo lỗi đọc được cả dạng mảng', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(geminiError(401, 'API key not valid'));
    await expect(
      new OpenAiCompatibleLlm('https://x', 'a,b').complete({
        system: '',
        messages: [],
        tools: [],
      }),
    ).rejects.toThrow('Model a lỗi 401: API key not valid');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('parsePriceRange (model giả)', () => {
  it.each([
    ['phòng 3-5 triệu', { minPrice: 3, maxPrice: 5 }],
    ['từ 2,5 đến 4 củ', { minPrice: 2.5, maxPrice: 4 }],
    ['dưới 4 củ ở cầu giấy', { maxPrice: 4 }],
    ['trên 6tr', { minPrice: 6 }],
    ['phòng có điều hoà', {}],
  ])('%s', (text, expected) => expect(parsePriceRange(text)).toEqual(expected));
});
