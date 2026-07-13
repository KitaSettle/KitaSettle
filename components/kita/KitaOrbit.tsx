"use client";

import { useEffect, useRef } from "react";
import type { VoiceChatState } from "@/lib/kita/use-voice-chat";

interface Star {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  twinklePhase: number;
}

interface KitaOrbitProps {
  state: VoiceChatState;
  audioLevel?: number;
  speakingPulse?: number;
  className?: string;
}

const STAR_COUNT = 70;

function createStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const band = i % 3;
    const baseRadius = 60 + band * 34 + Math.random() * 18;
    stars.push({
      angle: Math.random() * Math.PI * 2,
      radius: baseRadius,
      baseRadius,
      speed: (0.15 + Math.random() * 0.35) * (band === 1 ? -1 : 1),
      size: 0.8 + Math.random() * 1.8,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function speedMultiplierFor(state: VoiceChatState): number {
  switch (state) {
    case "listening":
      return 0.55;
    case "thinking":
      return 1.6;
    case "speaking":
      return 0.9;
    default:
      return 0.25;
  }
}

export function KitaOrbit({ state, audioLevel = 0, speakingPulse = 0, className = "" }: KitaOrbitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>(createStars());
  const stateRef = useRef(state);
  const audioLevelRef = useRef(audioLevel);
  const speakingPulseRef = useRef(speakingPulse);
  const accentColorRef = useRef("88, 200, 255");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    speakingPulseRef.current = speakingPulse;
  }, [speakingPulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const computed = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
    const rgbMatch = hexToRgb(computed);
    if (rgbMatch) accentColorRef.current = rgbMatch;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let frame = 0;
    let lastTime = performance.now();

    function draw(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const cx = width / 2;
      const cy = height / 2;
      const accent = accentColorRef.current;

      ctx!.clearRect(0, 0, width, height);

      const currentState = stateRef.current;
      const speedMul = speedMultiplierFor(currentState);
      const reactive =
        currentState === "listening"
          ? audioLevelRef.current
          : currentState === "speaking"
            ? speakingPulseRef.current
            : 0;

      const coreBase = Math.min(width, height) * 0.11;
      const coreRadius = coreBase * (1 + reactive * 0.6 + (currentState === "thinking" ? Math.sin(frame * 0.12) * 0.15 : 0));

      const coreGradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2.4);
      coreGradient.addColorStop(0, `rgba(${accent}, 0.9)`);
      coreGradient.addColorStop(0.4, `rgba(${accent}, 0.35)`);
      coreGradient.addColorStop(1, `rgba(${accent}, 0)`);
      ctx!.fillStyle = coreGradient;
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreRadius * 2.4, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = `rgba(${accent}, 0.95)`;
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreRadius * 0.55, 0, Math.PI * 2);
      ctx!.fill();

      const scale = Math.min(width, height) / 320;

      for (const star of starsRef.current) {
        if (!reducedMotion) {
          star.angle += star.speed * speedMul * dt;
        }
        const orbitRadius = star.baseRadius * scale * (1 + reactive * 0.08);
        const x = cx + Math.cos(star.angle) * orbitRadius;
        const y = cy + Math.sin(star.angle) * orbitRadius * 0.86;
        const twinkle = reducedMotion ? 0.7 : 0.55 + Math.sin(frame * 0.05 + star.twinklePhase) * 0.35;

        ctx!.fillStyle = `rgba(${accent}, ${Math.max(0.15, twinkle)})`;
        ctx!.beginPath();
        ctx!.arc(x, y, star.size * scale, 0, Math.PI * 2);
        ctx!.fill();
      }

      frame += 1;
      animationHandle = requestAnimationFrame(draw);
    }

    let animationHandle = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationHandle);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[320px] ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
    </div>
  );
}

function hexToRgb(hex: string): string | null {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return `${r}, ${g}, ${b}`;
}
