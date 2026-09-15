"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white"></div>
      
      <div className="z-10 max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-2">Sign in to your portal</p>
          </div>
          
          <form className="space-y-6" action="/api/auth/callback/credentials" method="POST">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm placeholder-slate-400
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                placeholder="you@university.edu"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm placeholder-slate-400
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">Remember me</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
