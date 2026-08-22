import type { SVGProps } from "react";

function baseProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

export function SequenceMemoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function ReverseRecallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 8h13" />
      <path d="M13.5 4.5 17 8l-3.5 3.5" />
      <path d="M20 16H7" />
      <path d="M10.5 12.5 7 16l3.5 3.5" />
    </svg>
  );
}

export function StoryMemoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 5.5c-1.8-1.2-4.2-1.5-6.5-1v13c2.3-.5 4.7-.2 6.5 1 1.8-1.2 4.2-1.5 6.5-1v-13c-2.3-.5-4.7-.2-6.5 1Z" />
      <path d="M12 5.5v13" />
    </svg>
  );
}

export function SpatialMemoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="3" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="10" y="3" width="5" height="5" rx="1" />
      <rect x="17" y="3" width="4" height="5" rx="1" />
      <rect x="3" y="10" width="5" height="5" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="17" y="10" width="4" height="5" rx="1" />
      <rect x="3" y="17" width="5" height="4" rx="1" />
      <rect x="10" y="17" width="5" height="4" rx="1" />
      <rect x="17" y="17" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

export function NBackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="2.5" y="9" width="4.5" height="6" rx="1" />
      <rect x="9.5" y="9" width="4.5" height="6" rx="1" fill="currentColor" />
      <rect x="16.5" y="9" width="4.5" height="6" rx="1" />
      <path d="M9.5 5.5 6.5 9M14 5.5l3 3.5" />
    </svg>
  );
}
