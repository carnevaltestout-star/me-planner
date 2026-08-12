import type { ComponentType, SVGProps } from "react";

interface EmptyTabPlaceholderProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
}

export default function EmptyTabPlaceholder({ icon: Icon, description }: EmptyTabPlaceholderProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
      <Icon className="mb-3 h-10 w-10 text-slate-300" />
      <p className="max-w-sm text-sm">{description}</p>
      <span className="mt-2.5 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-500">
        Empty placeholder — this tab's own mockup comes later
      </span>
    </div>
  );
}
