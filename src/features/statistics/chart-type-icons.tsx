import type { SVGProps } from "react";

function baseProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

export function BarChartTypeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <line x1="3.5" y1="20.5" x2="20.5" y2="20.5" />
      <rect x="5.5" y="13" width="3.4" height="7.5" />
      <rect x="10.3" y="8.5" width="3.4" height="12" />
      <rect x="15.1" y="4" width="3.4" height="16.5" />
    </svg>
  );
}

export function LineChartTypeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <line x1="3.5" y1="20.5" x2="20.5" y2="20.5" />
      <path d="M4.5 16.5 9 11.5 13 14.5 19.5 6" />
      <circle cx="4.5" cy="16.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PieChartTypeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12Z" />
      <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
    </svg>
  );
}

export function HistogramTypeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <line x1="3.5" y1="20.5" x2="20.5" y2="20.5" />
      <rect x="4" y="14.5" width="4" height="6" />
      <rect x="8" y="9" width="4" height="11.5" />
      <rect x="12" y="6" width="4" height="14.5" />
      <rect x="16" y="11.5" width="4" height="9" />
    </svg>
  );
}
