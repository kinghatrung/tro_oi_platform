import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { ChatService } from './chat.service.js';

const starter = new Types.ObjectId();
const owner = new Types.ObjectId();
const outsider = new Types.ObjectId();
const conversationId = new Types.ObjectId();

/** Model giả: chỉ những hàm ChatService gọi tới. */
const setup = () => {
  const conversation = { _id: conversationId, starter, owner };
  const chain = (value: unknown) => ({
    populate: () => ({ exec: async () => value }),
    exec: async () => value,
  });
  const updates: unknown[] = [];
  const conversationModel = {
    findById: () => chain(conversation),
    findByIdAndUpdate: (_id: unknown, update: unknown) => {
      updates.push(update);
      return chain(conversation);
    },
  };
  const messageModel = {
    create: jest.fn(async (values: Record<string, unknown>) => ({
      ...values,
      id: new Types.ObjectId().toString(),
      createdAt: new Date(),
    })),
  };
  const listing = { _id: new Types.ObjectId(), author: owner };
  const listingModel = { findOne: () => chain(listing) };
  const service = new ChatService(
    conversationModel as never,
    messageModel as never,
    listingModel as never,
    {} as never,
  );
  return { service, updates, messageModel, listing };
};

describe('ChatService', () => {
  it('tự nhắn tin của mình → 400', async () => {
    const { service, listing } = setup();
    await expect(
      service.startConversation(owner.toString(), {
        listingId: listing._id.toString(),
      }),
    ).rejects.toThrow('Không thể nhắn tin với chính mình');
  });

  it('thiếu hoặc thừa id đối tượng → 400', async () => {
    const { service } = setup();
    await expect(
      service.startConversation(starter.toString(), {}),
    ).rejects.toThrow('Cần đúng 1');
  });

  it('người ngoài gửi / đọc → 403', async () => {
    const { service } = setup();
    await expect(
      service.sendMessage(outsider.toString(), conversationId.toString(), 'hi'),
    ).rejects.toThrow('Bạn không thuộc cuộc trò chuyện này');
    await expect(
      service.markRead(outsider.toString(), conversationId.toString()),
    ).rejects.toThrow('Bạn không thuộc cuộc trò chuyện này');
  });

  it('nội dung rỗng / quá 1000 ký tự → 400, không lưu', async () => {
    const { service, messageModel } = setup();
    const id = conversationId.toString();
    await expect(
      service.sendMessage(starter.toString(), id, '   '),
    ).rejects.toThrow('Tin nhắn trống');
    await expect(
      service.sendMessage(starter.toString(), id, 'a'.repeat(1001)),
    ).rejects.toThrow('tối đa 1000');
    expect(messageModel.create).not.toHaveBeenCalled();
  });

  it('gửi tin → trim nội dung, +1 chưa đọc cho người kia', async () => {
    const { service, updates, messageModel } = setup();
    await service.sendMessage(
      starter.toString(),
      conversationId.toString(),
      '  Còn phòng không?  ',
    );
    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Còn phòng không?' }),
    );
    expect(updates[0]).toMatchObject({ $inc: { unreadByOwner: 1 } });

    await service.sendMessage(
      owner.toString(),
      conversationId.toString(),
      'Còn',
    );
    expect(updates[1]).toMatchObject({ $inc: { unreadByStarter: 1 } });
  });
});
