import type { Types } from 'mongoose';

import type { UserDocument } from '../auth/schemas/user.schema.js';
import type { Address, ListingDocument } from './schemas/listing.schema.js';

/** Field của User được populate vào listing.author. */
export const AUTHOR_FIELDS = 'name avatar role phone createdAt';

/** Ghép địa chỉ đầy đủ khi client không gửi fullAddress. */
export function withFullAddress(address: Address): Address {
  return {
    ...address,
    fullAddress:
      address.fullAddress ||
      [address.street, address.ward, address.district, address.city]
        .filter(Boolean)
        .join(', '),
  };
}

/** Document (author đã populate) → Listing (shape của @tro-oi/shared). */
export function toListing(
  doc: ListingDocument,
  extra: { listingCount?: number; favoriteCount?: number } = {},
) {
  const author = doc.author as unknown as UserDocument | Types.ObjectId;
  const isPopulated = author && 'name' in author;

  return {
    id: doc.id as string,
    title: doc.title,
    description: doc.description,
    videoUrl: doc.videoUrl || undefined,
    category: doc.category,
    transaction: doc.transaction,
    status: doc.status,
    price: doc.price,
    pricePerSquareMeter: doc.area
      ? Math.round(doc.price / doc.area)
      : undefined,
    area: doc.area,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    floorCount: doc.floorCount,
    direction: doc.direction,
    furnishing: doc.furnishing,
    amenities: doc.amenities ?? [],
    images: doc.images,
    address: doc.address,
    author: isPopulated
      ? {
          id: author.id as string,
          name: author.name,
          avatar: author.avatar,
          role: author.role,
          phone: author.phone,
          joinedAt: author.createdAt.toISOString(),
          listingCount: extra.listingCount,
        }
      : undefined,
    isFeatured: doc.isFeatured,
    viewCount: doc.viewCount ?? 0,
    expiresAt: doc.expiresAt?.toISOString(),
    favoriteCount: extra.favoriteCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export type ListingResponse = ReturnType<typeof toListing>;
