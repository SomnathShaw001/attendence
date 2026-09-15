import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white"></div>
      
      <main className="z-10 flex flex-col items-center text-center space-y-8 max-w-3xl px-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <span>Smart Attendance System is Live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
          Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Attendance</span> Management
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
          A smart, predictive, and intelligent attendance platform for modern institutions. Track attendance, predict debarment risks, and simulate "What-If" scenarios instantly.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Link href="/login" className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto">
            Login to Portal
          </Link>
          <Link href="/features" className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 w-full sm:w-auto">
            Explore Features
          </Link>
        </div>
      </main>

      {/* Decorative background elements */}
      <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white to-transparent z-0 pointer-events-none"></div>
    </div>
  );
}
