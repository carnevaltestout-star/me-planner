import type { ComponentType, SVGProps } from "react";
import type { TrackerIconKey } from "@/lib/trackers/tracker-types";

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

// Filled teardrop marker used for Period calendar cells — solid fill, not
// the outline style the rest of these icons use, since it's a small mark
// inside a grid cell rather than a nav-sized icon.
export function DropIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5c1.6 2.4 7 10.3 7 14.3a7 7 0 1 1-14 0c0-4 5.4-11.9 7-14.3Z" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps({ strokeWidth: 2.1, ...props })}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <path d="M8.5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V6" />
      <path d="M6.5 6 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 6" />
      <line x1="10" y1="10" x2="10" y2="16.5" />
      <line x1="14" y1="10" x2="14" y2="16.5" />
    </svg>
  );
}

function WaterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6.5 5h11l-1.6 13.2a2 2 0 0 1-2 1.8H10.1a2 2 0 0 1-2-1.8Z" />
      <line x1="5.5" y1="5" x2="18.5" y2="5" />
      <line x1="7.6" y1="10" x2="16.4" y2="10" />
    </svg>
  );
}

function PillowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 8.5C4 6 6 4.5 8.5 5.2c1.1.3 2.3.3 3.5.3s2.4 0 3.5-.3C18 4.5 20 6 20 8.5v7c0 2.5-2 4-4.5 3.3-1.1-.3-2.3-.3-3.5-.3s-2.4 0-3.5.3C6 19.5 4 18 4 15.5Z" />
      <path d="M9.5 9.5c.8.6 1.2 1.4 1.2 2.5s-.4 1.9-1.2 2.5" strokeWidth={1.3} />
      <path d="M14.5 9.5c-.8.6-1.2 1.4-1.2 2.5s.4 1.9 1.2 2.5" strokeWidth={1.3} />
    </svg>
  );
}

function StrawberryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 6.5c2 0 3.8.7 5 2 1.7 1.9 1.7 6-.8 9.4-1 1.4-2.6 2.1-4.2 2.1s-3.2-.7-4.2-2.1C5.3 14.5 5.3 10.4 7 8.5c1.2-1.3 3-2 5-2Z" />
      <path d="M12 6.5 10.5 3.5M12 6.5 12 3M12 6.5 13.5 3.5" strokeWidth={1.3} />
      <circle cx="9.7" cy="11" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="11" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="9.7" cy="16.5" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="16.5" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9.5 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 2.8c0 1 .4 1.9 1.1 2.5A3 3 0 0 0 8 18a3 3 0 0 0 4-1.3A3 3 0 0 0 16 18a3 3 0 0 0 2.4-5.2A2.8 2.8 0 0 0 17.5 9.6a3 3 0 0 0-3-3 3 3 0 0 0-5 0Z" />
      <line x1="12" y1="6" x2="12" y2="16.7" strokeWidth={1.3} />
    </svg>
  );
}

function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 19s-7.2-4.4-9.4-8.7C1 7 2.5 4 5.7 4c1.9 0 3.4 1 4.7 2.6C11.7 5 13.2 4 15.1 4c3.2 0 4.7 3 3.1 6.3C16 14.6 12 19 12 19Z" />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 6.2c-1.7-1.3-4-1.9-6.2-1.6-.7.1-1.3.7-1.3 1.4v11.6c0 .9.8 1.5 1.6 1.4 2-.3 4.2.2 5.9 1.5 1.7-1.3 3.9-1.8 5.9-1.5.9.1 1.6-.5 1.6-1.4V6c0-.7-.5-1.3-1.3-1.4-2.2-.3-4.5.3-6.2 1.6Z" />
      <line x1="12" y1="6.2" x2="12" y2="19" />
    </svg>
  );
}

function NotepadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4.5" y="4" width="15" height="17" rx="1.8" />
      <path d="M8.5 2.7v3M15.5 2.7v3" />
      <line x1="7.5" y1="10.5" x2="16.5" y2="10.5" />
      <line x1="7.5" y1="13.7" x2="16.5" y2="13.7" />
      <line x1="7.5" y1="16.9" x2="13" y2="16.9" />
    </svg>
  );
}

function RunningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="15" cy="4.6" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 21l2.2-4.6-2.4-2 1-4.4 3.8 2 .9 2.8 3 1.4" />
      <path d="M8.6 14 5 15.4M13.2 10l-.8-3-3.2 1.4" />
    </svg>
  );
}

function PlaneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2.5 12 21.5" />
      <path d="M4 9.5 20 15" />
      <path d="M12 4 6 9.5 12 11 18 9.5Z" />
      <path d="M9 18.5 12 21.5 15 18.5" />
    </svg>
  );
}

function ToothbrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 4 9.5 14.5" />
      <path d="M9.5 14.5c-1.8-1.8-4.7-1.8-6.5 0-1 1-1.5 2.3-1.5 3.5 1.2 0 2.5-.5 3.5-1.5 1.8-1.8 1.8-4.7 0-6.5" transform="translate(0.5 -0.5)" />
      <path d="M16.5 2 22 7.5" strokeWidth={1.3} />
      <path d="M18 3.5 20.5 6" strokeWidth={1.3} />
    </svg>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="4.3" />
      <line x1="12" y1="2.5" x2="12" y2="4.8" />
      <line x1="12" y1="19.2" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="4.8" y2="12" />
      <line x1="19.2" y1="12" x2="21.5" y2="12" />
      <line x1="5.3" y1="5.3" x2="6.9" y2="6.9" />
      <line x1="17.1" y1="17.1" x2="18.7" y2="18.7" />
      <line x1="18.7" y1="5.3" x2="17.1" y2="6.9" />
      <line x1="6.9" y1="17.1" x2="5.3" y2="18.7" />
    </svg>
  );
}

function MoneyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6.5 8 8.2 4.8h7.6L17.5 8" />
      <rect x="3.5" y="8" width="17" height="12" rx="2" />
      <path d="M12 11v6M13.4 11.9a1.6 1.6 0 0 0-1.4-.9c-1 0-1.6.6-1.6 1.3s.5 1 1.6 1.2c1.1.2 1.6.6 1.6 1.3s-.6 1.3-1.6 1.3a1.6 1.6 0 0 1-1.4-.9" strokeWidth={1.3} />
    </svg>
  );
}

function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3.5 6.5A2 2 0 0 1 5.5 4.5H13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8.2L5 15.5V12.5A2 2 0 0 1 3.5 10.5Z" />
      <path d="M10 14.5V16a2 2 0 0 0 2 2h4.8L20 21v-3.3A2 2 0 0 0 21.5 15.7v-4a2 2 0 0 0-2-2H15" />
    </svg>
  );
}

function MoonSleepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M17.5 13.8A7.7 7.7 0 0 1 8.2 4.5a7.7 7.7 0 1 0 9.3 9.3Z" />
      <line x1="17" y1="17.5" x2="20.5" y2="17.5" strokeWidth={1.3} />
      <line x1="15.5" y1="19.7" x2="18.3" y2="19.7" strokeWidth={1.3} />
    </svg>
  );
}

function BottleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 2.5h4v3.3l1.6 2.4c.6.9 1 1.9 1 3v8.3a2 2 0 0 1-2 2h-4.2a2 2 0 0 1-2-2v-8.3c0-1.1.3-2.1 1-3l1.6-2.4Z" />
      <line x1="10" y1="2.5" x2="14" y2="2.5" strokeWidth={2.1} />
      <line x1="9.3" y1="12.5" x2="14.7" y2="12.5" strokeWidth={1.3} />
    </svg>
  );
}

function ConsoleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.4a2.3 2.3 0 0 1-4-.9l-.3-1.4H8.7l-.3 1.4a2.3 2.3 0 0 1-4 .9l-.8-3.4A4 4 0 0 1 6.5 8Z" />
      <line x1="6.7" y1="12.3" x2="6.7" y2="14.7" strokeWidth={1.3} />
      <line x1="5.5" y1="13.5" x2="7.9" y2="13.5" strokeWidth={1.3} />
      <circle cx="16" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17.8" cy="13.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SpeechBubbleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.8v-3.8H6.5A2.5 2.5 0 0 1 4 13.5Z" />
      <line x1="8" y1="8.5" x2="16" y2="8.5" strokeWidth={1.3} />
      <line x1="8" y1="11.5" x2="13" y2="11.5" strokeWidth={1.3} />
    </svg>
  );
}

function UtensilsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 2.5v6.4M8.4 2.5v6.4M6 8.9c0 1.6 1.1 2.9 2.4 2.9v9.7" />
      <path d="M17 2.5c-1.8 0-3 2-3 5.3S15.2 12.7 17 12.7v8.8" />
    </svg>
  );
}

function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.3 7.5 8.3c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.4-1.2-.2-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9c2.9 0 5.1-2.3 5.1-5.1 0-3.6-4-6.1-8.5-6.1Z" />
      <circle cx="7.6" cy="10.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.7" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const TRACKER_LINE_ICONS: Record<TrackerIconKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  water: WaterIcon,
  pillow: PillowIcon,
  strawberry: StrawberryIcon,
  brain: BrainIcon,
  heart: HeartIcon,
  book: BookIcon,
  notepad: NotepadIcon,
  running: RunningIcon,
  plane: PlaneIcon,
  toothbrush: ToothbrushIcon,
  sun: SunIcon,
  money: MoneyIcon,
  chat: ChatIcon,
  moonSleep: MoonSleepIcon,
  bottle: BottleIcon,
  console: ConsoleIcon,
  speechBubble: SpeechBubbleIcon,
  utensils: UtensilsIcon,
  palette: PaletteIcon,
};
