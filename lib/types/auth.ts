import type { Session, User } from '@supabase/supabase-js';

export type AuthSnapshot = {
  user: User | null;
  session: Session | null;
};
