import { redirect } from 'next/navigation';
import { getServerAuthSnapshot } from '@/lib/auth/session';

export default async function HomePage() {
  const { session } = await getServerAuthSnapshot();
  if (session) redirect('/rooms');
  redirect('/splash');
}
