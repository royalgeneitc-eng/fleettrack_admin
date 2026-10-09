import Link from 'next/link';

/** Public legal pages (privacy policy, account deletion) required for Google Play. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="topbar text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9" />
          <Link href="/login" className="text-lg font-bold">
            Fleet<span className="text-[#60a5fa]">Track</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="card space-y-4 p-6 text-sm leading-6 text-slate-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </article>
      </main>
    </div>
  );
}
