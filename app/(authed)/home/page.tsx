import { renderHomePage } from '../../../src/features/today/home-page-loader';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return renderHomePage();
}
