import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat App Extreme',
  description: 'Private realtime chat for close friend groups.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
