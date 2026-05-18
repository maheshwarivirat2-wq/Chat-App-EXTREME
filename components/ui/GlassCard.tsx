export function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl ${className}`}>{children}</div>;
}
