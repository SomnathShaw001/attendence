"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCheck, Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(
    urlError === "OAuthSignin" || urlError === "OAuthCallback"
      ? "Google authentication could not be completed. Please check your network or try credentials."
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error);
      } else if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setErrorMessage("Failed to initiate Google sign in.");
      setIsGoogleLoading(false);
    }
  };

  const fillQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage("");
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
      {/* Brand */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25">
          <CheckCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Attendance</h1>
          <p className="text-xs text-slate-500 font-medium">Enterprise Academic Suite</p>
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-xl shadow-slate-900/5">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-slate-500">
              Sign in with your Google account or institutional credentials
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/60 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center h-11 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Or Institutional ID
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Institutional Credentials Form */}
          <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Institutional Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@university.edu"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center h-11"
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Test Accounts Quick-Fill Panel */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                Quick Role Testing Credentials:
              </span>
              <Badge variant="outline">Local</Badge>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillQuickLogin("admin@university.edu", "Admin@123")}
                className="px-2 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-slate-700 font-medium transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin("teacher@university.edu", "Teacher@123")}
                className="px-2 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-slate-700 font-medium transition-colors"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin("student@university.edu", "Student@123")}
                className="px-2 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-slate-700 font-medium transition-colors"
              >
                Student
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400 mt-6">
        Authorized institutional personnel only • Smart Attendance System
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <Suspense
        fallback={
          <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Loading authentication portal...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
