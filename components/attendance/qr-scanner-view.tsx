"use client";

import React, { useState, useRef } from "react";
import { submitQrAttendance, QrCheckinResult } from "@/app/attendance/qr/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Keyboard,
  ArrowRight,
  RefreshCw,
  Clock,
  School,
  BookOpen,
} from "lucide-react";

export function QrScannerView() {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QrCheckinResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera hardware not supported on this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode("camera");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unable to access device camera.";
      setCameraError(errMsg);
      setMode("manual");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await submitQrAttendance(manualCode.trim());
      setResult(res);
      if (res.success) {
        setManualCode("");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Submission failed.";
      setResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Scan QR Attendance
        </h1>
        <p className="text-sm text-slate-500">
          Point your device camera at the classroom projector screen to automatically register attendance.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mx-auto">
        <button
          onClick={startCamera}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === "camera"
              ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Camera Scanner</span>
        </button>

        <button
          onClick={() => {
            stopCamera();
            setMode("manual");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === "manual"
              ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Token Entry</span>
        </button>
      </div>

      {/* Scanner / Input Card */}
      <Card className="border-border/80 shadow-md overflow-hidden">
        <CardContent className="p-6">
          {mode === "camera" ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Target reticle */}
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/50 m-12 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-xs text-indigo-300 font-mono bg-slate-950/70 px-2 py-1 rounded">
                    Align QR within frame
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Scanning for rotating dynamic tokens. Codes expire in 10 seconds.
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stopCamera();
                  setMode("manual");
                }}
                className="w-full text-xs"
              >
                Switch to Token Entry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{cameraError} You can enter the live token payload below.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dynamic QR Payload
                </label>
                <textarea
                  rows={4}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder='Paste scanned token or JSON payload (e.g. {"sid":"...","seq":1,"sig":"..."})'
                  className="w-full p-3 text-xs font-mono rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !manualCode.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Signature...</span>
                  </>
                ) : (
                  <>
                    <span>Submit QR Attendance</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Feedback Banner */}
          {result && (
            <div
              className={`mt-6 p-4 rounded-2xl border transition-all ${
                result.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">
                    {result.success ? "Check-in Confirmed" : "Check-in Failed"}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{result.message}</p>

                  {result.sessionDetails && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 opacity-70" />
                        <span>
                          {result.sessionDetails.className} ({result.sessionDetails.section})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 opacity-70" />
                        <span>{result.sessionDetails.subjectCode}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        <span>Verified at {result.sessionDetails.recordedAt}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
