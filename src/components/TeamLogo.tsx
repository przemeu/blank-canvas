import { useData } from "@/context/AppContext";
import { cn } from "@/lib/format";

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function TeamLogo({ team, size = "sm", className }: { team: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const { logoFor } = useData();
  const src = logoFor(team);
  const dims = size === "lg" ? "h-20 w-20 sm:h-28 sm:w-28" : size === "md" ? "h-10 w-10" : "h-6 w-6";
  if (src)
    return <img src={src} alt={`${team} – herb`} loading="lazy" className={cn(dims, "shrink-0 object-contain", className)} />;
  return (
    <div
      className={cn(
        dims,
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 font-bold text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300",
        size === "lg" ? "text-xl sm:text-2xl" : size === "md" ? "text-xs" : "text-[8px]",
        className,
      )}
      title={team}
      aria-hidden
    >
      {initials(team)}
    </div>
  );
}
