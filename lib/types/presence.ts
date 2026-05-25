export type PresenceState = {
  userId: string;
  isOnline: boolean;
  customStatus: string | null;
  lastSeenAt: string;
};
