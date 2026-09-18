"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession, signOut } from "next-auth/react";

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200/80 shadow-xl shadow-slate-900/5 text-center">
        <CardContent className="p-8 space-y-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
            <p className="text-sm text-slate-500">
              You do not have the required institutional permissions to view this resource.
            </p>
          </div>

          {session?.user && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1">
              <p className="text-slate-500">
                Logged in as: <span className="font-semibold text-slate-900">{session.user.name || session.user.email}</span>
              </p>
              <p className="text-slate-500">
                Assigned Role: <span className="font-semibold text-indigo-600 uppercase">{session.user.role}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full" size="md">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="flex-1"
              size="md"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Switch Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
