import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

interface LocationCardProps {
  name: string;
  image: string;
  listingCount: number;
  href: string;
  featured?: boolean;
}

/** Displays a location image with its name and available listing count. */
export function LocationCard({
  name,
  image,
  listingCount,
  href,
  featured = false,
}: LocationCardProps) {
  return (
    <Link href={href} className="group relative block h-full min-h-30 overflow-hidden">
      {/* Image */}
      <Image
        src={image}
        alt={name}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-3 text-white">
        <h3 className={clsx('m-0 font-semibold text-white!', featured ? 'text-xl' : 'text-lg')}>
          {name}
        </h3>

        <p className="m-0 mt-0.5 text-sm text-white!">
          {listingCount.toLocaleString('vi-VN')} tin đăng
        </p>
      </div>
    </Link>
  );
}
