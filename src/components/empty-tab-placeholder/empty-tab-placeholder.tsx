import type { ComponentType, SVGProps } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { KAWAII_ICON_PACKS } from "@/components/kawaii-icons/kawaii-icons";

interface EmptyTabPlaceholderProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
  kawaiiIndex: number;
}

export default function EmptyTabPlaceholder({
  icon: FunctionalIcon,
  description,
  kawaiiIndex,
}: EmptyTabPlaceholderProps) {
  const theme = useTheme();
  const pack = KAWAII_ICON_PACKS[theme.iconPack];
  const Icon = pack ? pack[kawaiiIndex % pack.length] : FunctionalIcon;

  return (
    <div
      className="flex h-full flex-col items-center justify-center p-8 text-center"
      style={{ color: "var(--color-ink-muted)" }}
    >
      <Icon
        className="mb-3 h-30 w-10"
        style={{ color: "var(--color-border)", imageRendering: pack ? "pixelated" : undefined }}
      />
      <p className="max-w-sm text-sm">{description}</p>
      <span
        className="mt-2.5 rounded-full border border-dashed px-2.5 py-1 text-[11px] uppercase tracking-wide"
        style={{ borderColor: "var(--color-border)" }}
      >
        Empty placeholder — this tab's own mockup comes later
      </span>
    </div>
  );
}
