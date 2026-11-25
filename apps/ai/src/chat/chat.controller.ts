import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';

import { Orchestrator } from '../core/orchestrator.js';
import type { ChatEvent, RunSummary } from '../core/ports.js';
import { ChatLog } from '../store/chat-log.js';
import { AdminGuard } from './admin.guard.js';

/** Widget gửi kèm lịch sử ngắn (chưa lưu phiên ở server). */
const MAX_HISTORY = 10;
const MESSAGE_MAX = 1000;

/** Body sai → 400 kèm câu đầu tiên Zod báo. */
const parseOr400 = <S extends z.ZodType>(
  schema: S,
  value: unknown,
): z.infer<S> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException(
      parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    );
  }
  return parsed.data;
};

const FeedbackRequest = z.object({
  messageId: z.uuid(),
  rating: z.union([z.literal(1), z.literal(-1)]),
});

const LogQuery = z.object({
  filter: z.enum(['all', 'review', 'disliked', 'liked']).default('review'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const ChatRequest = z.object({
  /** Id phiên do widget tạo (sessionStorage) — gom các lượt của 1 cuộc trò chuyện trong log. */
  sessionId: z.uuid().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z
          .string()
          .trim()
          .min(1)
          .max(MESSAGE_MAX * 4),
      }),
    )
    .min(1)
    .max(40)
    // Lượt cuối phải là câu hỏi của người dùng, ≤ 1000 ký tự
    .refine(
      (messages) => {
        const last = messages.at(-1);
        return last?.role === 'user' && last.content.length <= MESSAGE_MAX;
      },
      { message: `Câu hỏi tối đa ${MESSAGE_MAX} ký tự` },
    ),
  context: z
    .object({
      page: z.string().max(200).optional(),
      section: z.enum(['housing', 'market']).optional(),
      isLoggedIn: z.boolean().optional(),
      /** Thẻ vừa hiện ở lượt trước — để hiểu "phòng thứ 2". Công cụ vẫn kiểm id qua API. */
      recentItems: z
        .array(
          z.object({
            kind: z.enum(['listing', 'product']),
            id: z.string().regex(/^[a-f0-9]{24}$/),
            title: z.string().max(150),
          }),
        )
        .max(6)
        .optional(),
    })
    .optional(),
});

const BUSY_MESSAGE = 'Trợ lý đang bận, bạn thử lại sau ít phút nhé.';

@Controller()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly orchestrator: Orchestrator,
    private readonly chatLog: ChatLog,
  ) {}

  @Get('health')
  health() {
    return { ok: true, model: this.orchestrator.modelName };
  }

  /**
   * POST /chat → SSE: status* → text → cards? → action? (widget mở trang kết quả) → done | error.
   * Giới hạn theo IP (ThrottlerModule, app.module.ts) vì khách chưa đăng nhập cũng dùng được.
   */
  @Post('chat')
  @UseGuards(ThrottlerGuard)
  async chat(@Body() body: unknown, @Res() res: Response) {
    const {
      messages,
      context = {},
      sessionId = randomUUID(),
    } = parseOr400(ChatRequest, body);

    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // nginx không gom buffer → sự kiện tới trình duyệt ngay
      'x-accel-buffering': 'no',
    });
    const send = ({
      event,
      data,
    }: ChatEvent | { event: 'done' | 'error'; data: object }) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // Người dùng đóng khung chat giữa chừng → huỷ gọi model, không tốn lượt
    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });

    const messageId = randomUUID();
    const started = Date.now();
    let summary: RunSummary = { text: '', cards: 0, tools: [], actions: [] };
    let failure: string | undefined;
    try {
      summary = await this.orchestrator.run(
        messages.slice(-MAX_HISTORY),
        context,
        send,
        abort.signal,
      );
      // messageId để widget gửi 👍 / 👎 cho đúng lượt này
      send({ event: 'done', data: { messageId } });
    } catch (error) {
      failure = (error as Error).message;
      if (!abort.signal.aborted) {
        this.logger.error(
          `Chat lỗi (${this.orchestrator.modelName}): ${failure}`,
        );
        send({ event: 'error', data: { message: BUSY_MESSAGE } });
      }
    } finally {
      res.end();
    }
    if (abort.signal.aborted) return; // người dùng đóng khung chat giữa chừng — không có gì để xem lại

    try {
      this.chatLog.save({
        id: messageId,
        sessionId,
        section: context.section,
        page: context.page,
        question: messages.at(-1)?.content ?? '',
        answer: summary.text,
        tools: summary.tools,
        cards: summary.cards,
        model: this.orchestrator.modelName,
        ms: Date.now() - started,
        error: failure,
      });
    } catch (error) {
      // Ghi log lỗi không được làm hỏng câu trả lời đã gửi
      this.logger.warn(`Không lưu được log chat: ${(error as Error).message}`);
    }
  }

  /** 👍 / 👎 cho 1 câu trả lời (ghi đè được). */
  @Post('feedback')
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  feedback(@Body() body: unknown) {
    const { messageId, rating } = parseOr400(FeedbackRequest, body);
    if (!this.chatLog.rate(messageId, rating)) {
      throw new NotFoundException('Không tìm thấy câu trả lời này');
    }
  }

  /** Nhật ký hội thoại cho trang quản trị — mặc định chỉ các câu cần xem lại. */
  @Get('admin/conversations')
  @UseGuards(AdminGuard)
  conversations(@Query() query: unknown) {
    const { filter, page, pageSize } = parseOr400(LogQuery, query);
    return this.chatLog.list(filter, page, pageSize);
  }
}
