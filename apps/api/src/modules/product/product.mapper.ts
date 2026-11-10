import type { Types } from 'mongoose';

import type { UserDocument } from '../auth/schemas/user.schema.js';
import type { ProductDocument } from './schemas/product.schema.js';

/** Field của User được populate vào product.seller. */
export const SELLER_FIELDS = 'name avatar phone createdAt';

/** Document (seller đã populate) → ProductItem (shape của @tro-oi/shared). */
export function toProduct(doc: ProductDocument) {
  const seller = doc.seller as unknown as UserDocument | Types.ObjectId;
  const isPopulated = seller && 'name' in seller;

  return {
    id: doc.id as string,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    condition: doc.condition,
    status: doc.status,
    price: doc.price,
    isNegotiable: doc.isNegotiable,
    images: doc.images,
    address: doc.address,
    seller: isPopulated
      ? {
          id: seller.id as string,
          name: seller.name,
          avatar: seller.avatar,
          phone: seller.phone,
          joinedAt: seller.createdAt.toISOString(),
        }
      : undefined,
    viewCount: doc.viewCount ?? 0,
    moderationNote: doc.moderationNote,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
