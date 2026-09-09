interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DetailPage({ params }: PageProps) {
  const { slug } = await params;

  return <div>DetailPage {slug}</div>;
}
