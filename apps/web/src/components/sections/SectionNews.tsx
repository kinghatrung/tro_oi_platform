import { Button } from 'antd';

import { CarouselItem } from '@/components/common';

interface SectionNews {
  title?: string;
  buttonText?: string;
}

export function SectionNews({ title, buttonText }: SectionNews) {
  return (
    <div className="bg-white rounded-lg p-5 mb-4">
      <p className="text-primary mb-4">{title}</p>
      <CarouselItem />
      {buttonText && <Button className="mx-auto block!">{buttonText}</Button>}
    </div>
  );
}
