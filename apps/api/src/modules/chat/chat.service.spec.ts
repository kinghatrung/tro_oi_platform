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
    {
      isStoredUrl: (url: string) => url.startsWith('http://api/uploads/'),
    } as never,
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

  it('tin chỉ có ảnh → lưu, xem trước là [Hình ảnh]', async () => {
    const { service, updates, messageModel } = setup();
    await service.sendMessage(
      starter.toString(),
      conversationId.toString(),
      '',
      ['http://api/uploads/a.jpg'],
    );
    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '',
        images: ['http://api/uploads/a.jpg'],
      }),
    );
    expect(updates[0]).toMatchObject({
      $set: { lastMessage: { content: '[Hình ảnh]' } },
    });
  });

  it('ảnh ngoài hệ thống / quá 4 ảnh → 400, không lưu', async () => {
    const { service, messageModel } = setup();
    const id = conversationId.toString();
    await expect(
      service.sendMessage(starter.toString(), id, '', [
        'https://evil.example/pixel.gif',
      ]),
    ).rejects.toThrow('Ảnh không hợp lệ');
    await expect(
      service.sendMessage(
        starter.toString(),
        id,
        '',
        Array.from({ length: 5 }, (_, i) => `http://api/uploads/${i}.jpg`),
      ),
    ).rejects.toThrow('Tối đa 4 ảnh');
    expect(messageModel.create).not.toHaveBeenCalled();
  });

  it('otherMemberId: trả người còn lại, người ngoài → 403', async () => {
    const { service } = setup();
    const id = conversationId.toString();
    await expect(service.otherMemberId(starter.toString(), id)).resolves.toBe(
      owner.toString(),
    );
    await expect(service.otherMemberId(owner.toString(), id)).resolves.toBe(
      starter.toString(),
    );
    await expect(
      service.otherMemberId(outsider.toString(), id),
    ).rejects.toThrow('không thuộc');
  });
});
