import { cn } from "@/lib/utils";
import { Shield, Award, Lock, Eye } from "lucide-react";

interface TrustBannerProps {
  className?: string;
}

const items = [
  { icon: Shield, label: "Department of Holistic Education", desc: "Organiser, with VBITR, Kurukshetra" },
  { icon: Lock, label: "Offline OMR", desc: "At the participating school" },
  { icon: Eye, label: "₹120 remitted", desc: "School retains ₹30 of ₹150" },
  { icon: Award, label: "Announced prizes", desc: "₹3,100, ₹2,100, ₹1,500, and ₹500" },
];

export function TrustBanner({ className }: TrustBannerProps) {
  return (
    <div className={cn("border-y border-stone-200 bg-white/80 backdrop-blur-sm", className)}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tejas-saffron-soft text-tejas-saffron">
              <item.icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-tejas-ink">{item.label}</p>
              <p className="text-xs text-tejas-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
