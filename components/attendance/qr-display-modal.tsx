"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getActiveQrToken, stopQrSession, ActiveQrSessionResponse } from "@/app/attendance/qr/actions";
import { generateQrPath } from "@/lib/qr-svg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, RefreshCw, X, Users, ShieldCheck, Copy, Check } from "lucide-react";

interface QrDisplayModalProps {
  initialSession: ActiveQrSessionResponse;
  onClose: () => void;
}

export function QrDisplayModal({ initialSession, onClose }: QrDisplayModalProps) {
  const sessionData = initialSession;
  const [tokenString, setTokenString] = useState(initialSession.tokenString);
  const [seq, setSeq] = useState(initialSession.seq);
  const [checkinsCount, setCheckinsCount] = useState(initialSession.totalCheckinsCount);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isStopping, setIsStopping] = useState(false);
  const [copied, setCopied] = useState(false);

  // SVG representation of active token computed as safe SVG path
  const qrPath = generateQrPath(tokenString, 280);

  // Rotate token every 10 seconds
  const fetchNextToken = useCallback(async () => {
    try {
      const res = await getActiveQrToken(sessionData.classSessionId, seq);
      setTokenString(res.tokenString);
      setSeq(res.seq);
      setCheckinsCount(res.checkinsCount);
      setSecondsRemaining(10);
    } catch (err) {
      console.error("Failed to rotate QR token:", err);
    }
  }, [sessionData.classSessionId, seq]);

  // Countdown timer for next rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchNextToken();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchNextToken]);

  const handleStopSession = async () => {
    setIsStopping(true);
    try {
      await stopQrSession(sessionData.classSessionId);
      onClose();
    } catch (err) {
      console.error("Failed to stop QR session:", err);
      setIsStopping(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tokenString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Live QR Roll Call</h3>
                <Badge variant="success" className="text-[10px] px-2 py-0 animate-pulse">
                  Streaming
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {sessionData.className} ({sessionData.section}) &bull; {sessionData.subjectCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Presentation Body */}
        <div className="p-8 flex flex-col items-center justify-center text-center">
          {/* Progress bar countdown */}
          <div className="w-full max-w-[280px] mb-4">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${secondsRemaining <= 3 ? "animate-spin text-amber-500" : ""}`} />
                Rotation Sequence #{seq}
              </span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                Rotates in {secondsRemaining}s
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(secondsRemaining / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* SVG QR Code */}
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200/80 mb-6 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${qrPath.size} ${qrPath.size}`}
              width={qrPath.size}
              height={qrPath.size}
              className="w-[280px] h-[280px] shape-rendering-crispEdges"
            >
              <rect width="100%" height="100%" fill="#ffffff" rx="12" />
              <path d={qrPath.pathD} fill="#0f172a" />
            </svg>
          </div>

          {/* Security & Check-in Counter */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-left flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium uppercase">Scanned In</span>
                <p className="text-lg font-bold text-slate-800 dark:text-white leading-none mt-0.5">
                  {checkinsCount} Students
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-left flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium uppercase">Anti-Replay</span>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 leading-none mt-1">
                  Active (10s TTL)
                </p>
              </div>
            </div>
          </div>

          {/* Manual Copy Code fallback */}
          <div className="w-full flex items-center justify-between text-xs text-slate-500 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60">
            <span className="truncate pr-2 font-mono text-[11px] max-w-[320px]">
              {tokenString}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 px-2 text-xs flex items-center gap-1 flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Hide Window
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={handleStopSession}
            disabled={isStopping}
            className="text-xs font-semibold"
          >
            {isStopping ? "Ending Roll Call..." : "Close QR Check-in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
