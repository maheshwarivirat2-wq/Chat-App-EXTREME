import Image from 'next/image';

export function StudioLogo() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 rounded-full bg-accentViolet/20 blur-3xl" />
      <Image
        src="/logo.png"
        alt="Studio logo"
        width={220}
        height={220}
        priority
        className="h-auto w-[180px] md:w-[220px] object-contain mix-blend-screen opacity-90 drop-shadow-[0_0_30px_rgba(124,58,237,0.45)]"
      />
    </div>
  );
}
