import type { SVGProps } from "react";

export default function PenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="3" width="13" height="17" rx="1.5" />
      <line x1="7" y1="8" x2="12" y2="8" />
      <line x1="7" y1="12" x2="10" y2="12" />
      <path d="M13.5 16.5l6-6a1.5 1.5 0 0 0-2-2l-6 6-1 3 3-1z" />
    </svg>
  );
}
