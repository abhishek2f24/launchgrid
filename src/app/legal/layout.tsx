import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black font-inter antialiased">
      <nav className="w-full p-6 border-b border-black/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold text-xs">
            LG
          </div>
          <span className="font-bold text-lg tracking-tight text-black">
            LaunchGrid
          </span>
        </Link>
        <Link href="/login" className="text-sm font-medium hover:underline">
          Back to Login
        </Link>
      </nav>
      <main className="max-w-3xl mx-auto py-16 px-6 prose prose-slate">
        {children}
      </main>
    </div>
  );
}
