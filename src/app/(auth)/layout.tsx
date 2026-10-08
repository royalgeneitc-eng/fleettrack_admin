/** Sign-in / sign-up frame: the same navy-to-violet hero as the Android app. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hero relative h-72 overflow-hidden sm:h-80">
        <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
          <path d="M0 60 C100 30 180 50 240 42 S360 30 400 40 V100 H0Z" fill="#a78bfa" fillOpacity="0.2" />
          <path d="M0 78 C120 58 240 74 400 62 V100 H0Z" fill="#071a52" fillOpacity="0.3" />
          <path d="M0 98 C120 82 200 72 300 70 L312 74 C210 78 130 88 40 100 H0Z" fill="#60a5fa" fillOpacity="0.35" />
        </svg>
        <div className="relative flex flex-col items-center pt-10 text-white">
          <div className="text-4xl font-bold tracking-tight">
            Fleet<span className="text-[#60a5fa]">Track</span>
          </div>
          <div className="mt-1 text-sm font-medium tracking-[0.2em] text-white/80">RECORD. ANALYZE. GROW.</div>
          <div className="mt-5 flex h-28 w-28 items-center justify-center rounded-full bg-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FleetTrack" className="h-24 w-24" />
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto -mt-12 w-full max-w-md px-4 pb-10">
        <div className="card p-6 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
