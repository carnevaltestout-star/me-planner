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

export function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="3.5" width="7.8" height="7.8" rx="1.8" />
      <rect x="12.7" y="3.5" width="7.8" height="7.8" rx="1.8" />
      <rect x="3.5" y="12.7" width="7.8" height="7.8" rx="1.8" />
      <rect x="12.7" y="12.7" width="7.8" height="7.8" rx="1.8" />
    </svg>
  );
}

// The "Overview" tab's own icon (the app's default/first tab) — a plain
// house, distinct from the 2x2-grid icon above which now belongs to
// "Dashboard" (the grid-of-cards tab).
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <rect x="9.5" y="13.5" width="5" height="6.5" rx="1" />
    </svg>
  );
}

export function PlannerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.2" />
      <line x1="3.5" y1="9" x2="20.5" y2="9" />
      <line x1="8" y1="3" x2="8" y2="6.2" />
      <line x1="16" y1="3" x2="16" y2="6.2" />
      <line x1="7.2" y1="13" x2="9.4" y2="13" />
      <line x1="11.5" y1="13" x2="13.7" y2="13" />
      <line x1="15.8" y1="13" x2="18" y2="13" />
      <line x1="7.2" y1="16.6" x2="9.4" y2="16.6" />
      <line x1="11.5" y1="16.6" x2="13.7" y2="16.6" />
    </svg>
  );
}

export function JournalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 6.2c-1.7-1.3-4-1.9-6.2-1.6-.7.1-1.3.7-1.3 1.4v11.6c0 .9.8 1.5 1.6 1.4 2-.3 4.2.2 5.9 1.5 1.7-1.3 3.9-1.8 5.9-1.5.9.1 1.6-.5 1.6-1.4V6c0-.7-.5-1.3-1.3-1.4-2.2-.3-4.5.3-6.2 1.6Z" />
      <line x1="12" y1="6.2" x2="12" y2="19" />
    </svg>
  );
}

export function PrinciplesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2 12.9 13a1.4 1.4 0 0 1-.7.7l-3.8 1.9 1.9-3.8a1.4 1.4 0 0 1 .7-.7Z" />
    </svg>
  );
}

export function VocabularyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5.5" y="3.7" width="13" height="9.2" rx="1.6" transform="rotate(-6 12 8.3)" />
      <rect x="4.7" y="10.8" width="14.6" height="9.5" rx="1.8" />
      <line x1="8" y1="15" x2="15.5" y2="15" />
      <line x1="8" y1="17.6" x2="13" y2="17.6" />
    </svg>
  );
}

export function AttachmentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16.8 7.2 9.1 14.9a2.6 2.6 0 0 0 3.7 3.7l7.4-7.4a4.3 4.3 0 1 0-6.1-6.1L6.6 12.5a6 6 0 1 0 8.5 8.5" />
    </svg>
  );
}

export function TrackersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 12.5h3.6l1.7-4.6 3 9.4 2-6.4 1.4 2.9H21" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function GoalsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BookReviewsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 4.8c0-.7.6-1.2 1.3-1.1 2 .2 4.2.8 5.7 2 1.5-1.2 3.7-1.8 5.7-2 .7-.1 1.3.4 1.3 1.1v13.6c0 .6-.5 1.1-1.1 1.2-2.1.2-4.3.8-5.9 2-1.6-1.2-3.8-1.8-5.9-2-.6-.1-1.1-.6-1.1-1.2Z" />
      <line x1="12" y1="5.7" x2="12" y2="19.6" />
      <path d="M9 8.4h1.6M9 11h1.6" strokeWidth={1.5} />
    </svg>
  );
}

export function StatisticsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="13" width="3" height="7" />
      <rect x="11" y="9" width="3" height="11" />
      <rect x="16" y="5" width="3" height="15" />
    </svg>
  );
}

export function FinanceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="6" width="17" height="13" rx="2" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9.3 4.8a2.4 2.4 0 0 0-2.4 2.4v.3a2.6 2.6 0 0 0-1.7 2.4c0 .5.15 1 .4 1.4a2.6 2.6 0 0 0 0 4.4c-.25.4-.4.9-.4 1.4a2.6 2.6 0 0 0 2.6 2.6h.1a2.4 2.4 0 0 0 2.4 1.9" />
      <path d="M14.7 4.8a2.4 2.4 0 0 1 2.4 2.4v.3a2.6 2.6 0 0 1 1.7 2.4c0 .5-.15 1-.4 1.4a2.6 2.6 0 0 1 0 4.4c.25.4.4.9.4 1.4a2.6 2.6 0 0 1-2.6 2.6h-.1a2.4 2.4 0 0 1-2.4 1.9" />
      <path d="M9.3 4.8v14.2M14.7 4.8v14.2" />
      <path d="M6.9 9.9c.9.6 2.1.6 3 0M6.9 14.3c.9.6 2.1.6 3 0M14.1 9.9c.9.6 2.1.6 3 0M14.1 14.3c.9.6 2.1.6 3 0" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.17a2.06 2.06 0 1 1-4.12 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H2.6a2.06 2.06 0 1 1 0-4.12h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V2.6a2.06 2.06 0 1 1 4.12 0v.09a1.7 1.7 0 0 0 1.03 1.56h.08a1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03h.17a2.06 2.06 0 1 1 0 4.12h-.09a1.7 1.7 0 0 0-1.56 1.03Z" />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)} strokeWidth={1.9}>
      <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
    </svg>
  );
}
