import type { ComponentType, ReactNode, SVGProps } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { RETRO_NAV_ICONS } from "@/components/retro-gimmicks/retro-nav-icons";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";

interface StatCardShellProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconPath: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export function StatCardShell({ icon: Icon, iconPath, title, children, wide }: StatCardShellProps) {
  const theme = useTheme();
  const pixelated = theme.retro || theme.kawaii;
  const DisplayIcon = pixelated ? RETRO_NAV_ICONS[iconPath] ?? Icon : Icon;
  return (
    <div
      className={`flex flex-col gap-3 rounded-theme border border-border bg-surface p-3.5 shadow-theme md:p-4 ${
        wide ? "md:col-span-2 xl:col-span-3" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-accent-soft)" }}
        >
          <DisplayIcon
            className="h-[17px] w-[17px]"
            style={{ color: "var(--color-accent)", imageRendering: pixelated ? "pixelated" : undefined }}
          />
        </span>
        <h3 className="m-0 text-sm font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-theme-sm bg-canvas px-2 py-1.5">
      <span className="text-[0.62rem] uppercase tracking-wide text-ink-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

export function StatEmpty({ message = "Not enough data yet." }: { message?: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-theme-sm border border-dashed border-border px-4 text-center">
      <p className="m-0 text-xs text-ink-muted">{message}</p>
    </div>
  );
}

export function AxisCaption({ x, y }: { x: string; y: string }) {
  return (
    <p className="m-0 text-[0.65rem] text-ink-muted">
      X: {x} · Y: {y}
    </p>
  );
}

export function resolveChartType(selected: ChartType, supported: ChartType[]): ChartType {
  return supported.includes(selected) ? selected : supported[0];
}

export function xAxisLabelFor(range: TimeRange): string {
  if (range === "week") return "Days of the week";
  if (range === "month") return "Days of the month";
  if (range === "year") return "Months";
  return "Months";
}

export function rangeNoun(range: TimeRange): string {
  if (range === "week") return "this week";
  if (range === "month") return "this month";
  if (range === "year") return "this year";
  return "all time";
}
