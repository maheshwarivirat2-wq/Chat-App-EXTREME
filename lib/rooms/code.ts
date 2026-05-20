const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateRoomCode = (length = 6) => {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};
