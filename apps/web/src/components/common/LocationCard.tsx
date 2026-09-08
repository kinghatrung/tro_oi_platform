import Image from 'next/image';
import { Card } from 'antd';
import clsx from 'clsx';

interface Location {
  name: string;
  image: string;
  listingCount: number;
  featured?: boolean;
}

export function LocationCard({ name, image, listingCount, featured = false }: Location) {
  return (
    <Card
      variant="borderless"
      styles={{
        body: {
          padding: 0,
          height: '100%',
        },
      }}
      className={clsx('group h-full overflow-hidden rounded-none!', 'cursor-pointer')}
    >
      <div className="relative h-full min-h-30 overflow-hidden">
        {/* Image */}
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />

        {/* Overlay */}
        <div
          className="
            absolute inset-0
            bg-linear-to-t
            from-black/65
            via-black/10
            to-transparent
          "
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-3 text-white">
          <h3 className={clsx('m-0 font-semibold text-white!', featured ? 'text-xl' : 'text-lg')}>
            {name}
          </h3>

          <p className="m-0 mt-0.5 text-sm text-white!">
            {listingCount.toLocaleString('vi-VN')} tin đăng
          </p>
        </div>
      </div>
    </Card>
  );
}
