import { redirect } from 'next/navigation';
import { getServerAuthSnapshot } from './session';

export const requireAuth = async () => {
  const snapshot = await getServerAuthSnapshot();
  if (!snapshot.user) redirect('/auth');
  return snapshot;
};
