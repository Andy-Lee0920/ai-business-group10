import { RecordsScreen } from '../../../src/features/records/records-screen';
import { loadRecordsScreenProps, resolveRecordsDataSource } from '../../../src/features/records/records-page-loader';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const source = await resolveRecordsDataSource();
  const props = await loadRecordsScreenProps(source);
  return <RecordsScreen {...props} />;
}
