import { renderHomePage } from '../../../src/features/today/home-page-loader';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  return renderHomePage(await searchParams);
}
