import { redirect } from 'next/navigation';
import { getServerAuthSnapshot } from './session';

export const requireAuth = async () => {
  const snapshot = await getServerAuthSnapshot();
  if (!snapshot.session) redirect('/auth');
  return snapshot;
};
