"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ArrowRight } from "lucide-react";
import { AudioWaveform } from "@/components/scenes/AudioWaveform";
import { cn } from "@/lib/utils";

const BAR_COUNT = 28;
const MAX_SECONDS = 30;

interface CameraCaptureProps {
  onComplete: (durationSeconds: number) => void;
}

type PermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "not-found"
  | "unsupported";

export function CameraCapture({ onComplete }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [permission, setPermission] = useState<PermissionState>("idle");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0.1));

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  // The <video> element only mounts once permission flips to "granted",
  // so srcObject has to be assigned here — setting it inline during the
  // getUserMedia() resolution runs before the element exists in the DOM.
  useEffect(() => {
    if (permission !== "granted" || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [permission]);

  const requestAccess = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setPermission("unsupported");
      return;
    }

    stopStream();
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      setPermission("granted");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPermission("not-found");
      } else {
        setPermission("denied");
      }
    }
  };

  const startRecording = () => {
    setRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) {
          finishRecording(s + 1);
          return s + 1;
        }
        return s + 1;
      });
    }, 1000);

    const analyser = analyserRef.current;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const idx = Math.floor((i / BAR_COUNT) * data.length);
          return data[idx] / 255;
        });
        setLevels(next);
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      const tick = () => {
        setLevels(Array.from({ length: BAR_COUNT }, () => Math.random() * 0.6 + 0.1));
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }
  };

  const finishRecording = (finalSeconds: number) => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    stopStream();
    onComplete(finalSeconds);
  };

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-8">
      <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] border border-gold/25 bg-midnight-2/95 shadow-2xl shadow-black/60 backdrop-blur-sm">
        {permission === "granted" ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full scale-x-[-1] object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center">
            {permission === "requesting" && (
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-gold"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            )}

            {permission === "requesting" && (
              <p className="text-sm text-porcelain-dim">Requesting camera access…</p>
            )}

            {permission === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-4"
              >
                <Camera
                  size={26}
                  strokeWidth={1.5}
                  className="text-gold/80 drop-shadow-[0_0_10px_rgba(242,200,121,0.35)]"
                />
                <p className="font-display text-xl text-porcelain">Camera access needed</p>
                <div className="flex items-center gap-3 opacity-60">
                  <span className="h-px w-8 bg-gold/40" />
                  <span className="text-xs text-gold/60">✦</span>
                  <span className="h-px w-8 bg-gold/40" />
                </div>
                <p className="text-sm leading-relaxed text-porcelain-dim">
                  We&apos;ll need your camera and mic for this one.
                </p>
              </motion.div>
            )}

            {permission === "denied" && (
              <>
                <p className="font-display text-lg text-porcelain">Camera access needed</p>
                <p className="text-sm text-porcelain-dim">
                  Camera access was blocked. You can allow it from your browser&apos;s
                  address-bar settings, or continue without video.
                </p>
                <button
                  onClick={requestAccess}
                  className="text-xs uppercase tracking-[0.3em] text-gold hover:text-porcelain"
                >
                  Try again
                </button>
              </>
            )}

            {permission === "not-found" && (
              <>
                <p className="font-display text-lg text-porcelain">No camera found</p>
                <p className="text-sm text-porcelain-dim">
                  We couldn&apos;t detect a camera or microphone on this device. You can
                  still continue — we&apos;ll time your answer without video.
                </p>
              </>
            )}

            {permission === "unsupported" && (
              <p className="text-sm text-porcelain-dim">
                Your browser doesn&apos;t support camera recording. You can still
                continue — we&apos;ll time your answer without video.
              </p>
            )}
          </div>
        )}

        {recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm"
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-coral"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            <span className="text-xs font-medium tracking-wide text-porcelain">
              REC
            </span>
            <span className="text-xs tabular-nums text-porcelain/80">
              {minutes}:{secs}
            </span>
          </motion.div>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-gold/15" />
      </div>

      <AudioWaveform levels={levels} active={recording} />

      <div>
        {permission === "idle" && (
          <button
            onClick={requestAccess}
            className={cn(
              "group flex items-center gap-2 rounded-full bg-porcelain px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-midnight shadow-[0_0_22px_-8px_rgba(242,200,121,0.4)] transition-all duration-300 hover:bg-gold hover:shadow-[0_0_28px_-6px_rgba(242,200,121,0.55)]"
            )}
          >
            Enable Camera
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {(permission === "denied" ||
          permission === "not-found" ||
          permission === "unsupported") &&
          !recording && (
            <button
              onClick={() => startRecording()}
              className="rounded-full border border-porcelain/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-porcelain transition hover:border-porcelain/60"
            >
              Continue Without Camera
            </button>
          )}

        {permission === "granted" && !recording && (
          <button
            onClick={startRecording}
            className="rounded-full bg-coral px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-midnight transition hover:bg-porcelain"
          >
            Start Recording
          </button>
        )}

        {recording && (
  <button
    onClick={() => finishRecording(seconds)}
    className="rounded-full border border-gold/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-gold transition-all duration-300 hover:border-gold/60 hover:bg-gold/[0.08]"
  >
    Stop Recording
  </button>
)}

      </div>
    </div>
  );
}
