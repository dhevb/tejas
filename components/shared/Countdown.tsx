"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownProps {
  targetDate: string;
  label?: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-tejas-blue px-4 py-3 min-w-[4.5rem]">
      <span className="text-2xl font-bold tabular-nums text-white">{String(value).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/70">{label}</span>
    </div>
  );
}

export function Countdown({ targetDate, label = "Registration closes in", className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(targetDate);
    const update = () => setTimeLeft(calcTimeLeft(target));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className={cn("rounded-2xl border border-stone-200 bg-white p-6 shadow-tejas", className)}>
      <p className="text-sm font-medium text-tejas-muted">{label}</p>
      <div className="mt-4 flex flex-wrap gap-3" role="timer" aria-live="polite">
        {timeLeft ? (
          <>
            <Unit value={timeLeft.days} label="Days" />
            <Unit value={timeLeft.hours} label="Hours" />
            <Unit value={timeLeft.minutes} label="Min" />
            <Unit value={timeLeft.seconds} label="Sec" />
          </>
        ) : (
          <p className="text-sm text-tejas-muted">The countdown appears after this page loads.</p>
        )}
      </div>
    </div>
  );
}
