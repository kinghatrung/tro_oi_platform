import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types, type Model } from 'mongoose';

import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import { CONVERSATION_POPULATE, toMessage } from './chat.mapper.js';
import type { MessagesQueryDto, StartConversationDto } from './chat.dto.js';
import {
  Conversation,
  type ConversationDocument,
} from './schemas/conversation.schema.js';
import {
  MESSAGE_MAX_LENGTH,
  Message,
  type MessageDocument,
} from './schemas/message.schema.js';

const LIST_LIMIT = 100;

/** Mọi hàm nhận userId từ JWT/socket đã xác thực, không tin id người dùng do client gửi. */
@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /** Cuộc trò chuyện của tôi (cả khi hỏi lẫn khi được hỏi), mới nhắn trước. */
  listConversations(userId: string) {
    return this.conversationModel
      .find({ $or: [{ starter: userId }, { owner: userId }] })
      .sort({ updatedAt: -1 })
      .limit(LIST_LIMIT)
      .populate(CONVERSATION_POPULATE)
      .exec();
  }

  async unreadCount(userId: string) {
    const [row] = await this.conversationModel
      .aggregate<{ total: number }>([
        {
          $match: {
            $or: [
              { starter: new Types.ObjectId(userId) },
              { owner: new Types.ObjectId(userId) },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [
                  { $eq: ['$starter', new Types.ObjectId(userId)] },
                  '$unreadByStarter',
                  '$unreadByOwner',
                ],
              },
            },
          },
        },
      ])
      .exec();
    return row?.total ?? 0;
  }

  /** Find-or-create theo (tin/món đồ, người hỏi). Chỉ tin đang hiển thị, không tự nhắn mình. */
  async startConversation(userId: string, dto: StartConversationDto) {
    if (Boolean(dto.listingId) === Boolean(dto.productId)) {
      throw new BadRequestException(
        'Cần đúng 1 trong listingId hoặc productId',
      );
    }
    const isListing = Boolean(dto.listingId);
    const targetId = (dto.listingId ?? dto.productId)!;
    const target = isListing
      ? await this.listingModel
          .findOne({ _id: targetId, status: 'active' }, 'author')
          .exec()
      : await this.productModel
          .findOne({ _id: targetId, status: 'active' }, 'seller')
          .exec();
    if (!target) {
      throw new NotFoundException(
        isListing ? 'Không tìm thấy tin đăng' : 'Không tìm thấy món đồ',
      );
    }
    const owner = isListing
      ? (target as ListingDocument).author
      : (target as ProductDocument).seller;
    if (owner.equals(userId)) {
      throw new BadRequestException('Không thể nhắn tin với chính mình');
    }

    const filter = { target: target._id, starter: userId };
    const upsert = () =>
      this.conversationModel
        .findOneAndUpdate(
          filter,
          {
            $setOnInsert: {
              targetModel: isListing ? 'Listing' : 'Product',
              owner,
            },
          },
          { upsert: true, returnDocument: 'after' },
        )
        .populate(CONVERSATION_POPULATE)
        .exec();
    try {
      return (await upsert())!;
    } catch (error) {
      // 2 request cùng lúc: request sau đụng unique index → bản đã tạo
      if ((error as { code?: number }).code !== 11000) throw error;
      return (await this.conversationModel
        .findOne(filter)
        .populate(CONVERSATION_POPULATE)
        .exec())!;
    }
  }

  /** Lịch sử tin nhắn (cũ → mới), phân trang lùi theo `before`. */
  async getMessages(userId: string, id: string, query: MessagesQueryDto) {
    await this.findMember(userId, id);
    const docs = await this.messageModel
      .find({
        conversation: id,
        ...(query.before && { createdAt: { $lt: new Date(query.before) } }),
      })
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .exec();
    return docs.reverse().map(toMessage);
  }

  /** Lưu tin, cập nhật lastMessage và +1 chưa đọc cho người kia. */
  async sendMessage(userId: string, id: string, content: string) {
    const text = content.trim();
    if (!text) throw new BadRequestException('Tin nhắn trống');
    if (text.length > MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(
        `Tin nhắn tối đa ${MESSAGE_MAX_LENGTH} ký tự`,
      );
    }
    const conversation = await this.findMember(userId, id);
    const message = await this.messageModel.create({
      conversation: conversation._id,
      sender: userId,
      content: text,
    });
    const unreadField = conversation.starter.equals(userId)
      ? 'unreadByOwner'
      : 'unreadByStarter';
    const updated = await this.conversationModel
      .findByIdAndUpdate(
        conversation._id,
        {
          $set: {
            lastMessage: {
              id: message._id,
              sender: message.sender,
              content: message.content,
              createdAt: message.createdAt,
            },
          },
          $inc: { [unreadField]: 1 },
        },
        { returnDocument: 'after' },
      )
      .populate(CONVERSATION_POPULATE)
      .exec();
    return { message: toMessage(message), conversation: updated! };
  }

  /** Về 0 số chưa đọc của người gọi. Không đổi updatedAt (thứ tự danh sách). */
  async markRead(userId: string, id: string) {
    const conversation = await this.findMember(userId, id);
    const field = conversation.starter.equals(userId)
      ? 'unreadByStarter'
      : 'unreadByOwner';
    await this.conversationModel
      .updateOne({ _id: id }, { $set: { [field]: 0 } }, { timestamps: false })
      .exec();
    return null;
  }

  private async findMember(userId: string, id: string) {
    const conversation = isValidObjectId(id)
      ? await this.conversationModel.findById(id).exec()
      : null;
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    if (
      !conversation.starter.equals(userId) &&
      !conversation.owner.equals(userId)
    ) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }
    return conversation;
  }
}
