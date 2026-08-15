import type { ComponentType, SVGProps } from "react";
import { StatCardShell, StatEmpty } from "./stat-card-shell";

interface StubStatCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconPath: string;
  title: string;
  message: string;
}

// Principles, Vocabulary, and Goals don't have a real data model behind
// them yet (still placeholder tabs) — per spec, that means a genuinely
// empty card, not fabricated numbers. The card shell stays visible so it's
// clear this statistic will populate once that feature exists for real.
export default function StubStatCard({ icon, iconPath, title, message }: StubStatCardProps) {
  return (
    <StatCardShell icon={icon} iconPath={iconPath} title={title}>
      <StatEmpty message={message} />
    </StatCardShell>
  );
}
