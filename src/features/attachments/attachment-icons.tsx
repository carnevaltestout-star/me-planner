import { useId, type SVGProps } from "react";
import { pixelGlyph } from "@/components/kawaii-icons/kawaii-icons";
import { useTheme } from "@/components/theme-provider/theme-context";

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

function FolderLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps({ strokeWidth: 1.8, ...props })}>
      <path
        d="M3 6.3A1.8 1.8 0 0 1 4.8 4.5h4.6l2 2.3h7.8A1.8 1.8 0 0 1 21 8.6v9.1a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 17.7Z"
        fill="currentColor"
        fillOpacity={0.12}
      />
    </svg>
  );
}

// "New folder" glyph — a plain folder outline with a "+" printed in the
// middle, the standard create-a-folder icon. One shared design across every
// theme (it's an action icon, not folder content, so it doesn't need its
// own retro/kawaii/tryout variant the way FolderIcon does).
export function NewFolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps({ strokeWidth: 1.7, ...props })}>
      <path d="M3 6.3A1.8 1.8 0 0 1 4.8 4.5h4.6l2 2.3h7.8A1.8 1.8 0 0 1 21 8.6v9.1a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 17.7Z" />
      <line x1="12" y1="10.6" x2="12" y2="15.8" />
      <line x1="9.4" y1="13.2" x2="14.6" y2="13.2" />
    </svg>
  );
}

// Classic skeuomorphic folder — a two-tone pink back+front pocket with a
// tab, rounded corners baked into the path itself, and a drop-shadow filter
// (not a bitmap) so it reads as a "real" folder icon rather than pixel art.
// Used for both retro and kawaii, replacing each theme's previous look with
// one shared, bigger glyph.
function FolderClassicIcon(props: SVGProps<SVGSVGElement>) {
  const { style, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" {...rest} style={{ filter: "drop-shadow(0 3px 3px rgba(120, 60, 90, 0.35))", ...style }}>
      <path
        d="M2 6.5A1.5 1.5 0 0 1 3.5 5h5.6l2.1 2.1h9.3A1.5 1.5 0 0 1 22 8.6V18.5A1.5 1.5 0 0 1 20.5 20h-17A1.5 1.5 0 0 1 2 18.5Z"
        fill="#ff8fb8"
      />
      <path
        d="M2 10A1.7 1.7 0 0 1 3.7 8.3h16.6A1.7 1.7 0 0 1 22 10v8.3a1.7 1.7 0 0 1-1.7 1.7H3.7A1.7 1.7 0 0 1 2 18.3Z"
        fill="#ffb6d3"
      />
    </svg>
  );
}

// Kawaii-only: the same classic folder, with a tiny white cat face printed
// on the front pocket — two dot eyes, three whisker lines fanned out on
// each side, and a sideways "3" for the mouth (the classic ":3" cat-mouth
// shape, drawn already rotated rather than rotating a literal glyph).
function FolderKawaiiIcon(props: SVGProps<SVGSVGElement>) {
  const { style, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" {...rest} style={{ filter: "drop-shadow(0 3px 3px rgba(120, 60, 90, 0.35))", ...style }}>
      <path
        d="M2 6.5A1.5 1.5 0 0 1 3.5 5h5.6l2.1 2.1h9.3A1.5 1.5 0 0 1 22 8.6V18.5A1.5 1.5 0 0 1 20.5 20h-17A1.5 1.5 0 0 1 2 18.5Z"
        fill="#ff8fb8"
      />
      <path
        d="M2 10A1.7 1.7 0 0 1 3.7 8.3h16.6A1.7 1.7 0 0 1 22 10v8.3a1.7 1.7 0 0 1-1.7 1.7H3.7A1.7 1.7 0 0 1 2 18.3Z"
        fill="#ffb6d3"
      />
      <g stroke="#ffffff" strokeWidth={0.6} strokeLinecap="round" fill="none">
        <line x1="10.2" y1="13.9" x2="9" y2="13.7" />
        <line x1="10.2" y1="14" x2="9" y2="14" />
        <line x1="10.2" y1="14.35" x2="9" y2="14.6" />
        <line x1="13.8" y1="13.9" x2="15" y2="13.7" />
        <line x1="13.8" y1="14" x2="15" y2="14" />
        <line x1="13.8" y1="14.35" x2="15" y2="14.6" />
        <path d="M11 14.4 Q11.6 15.9 12 14.4 Q12.4 15.9 13 14.4" />
      </g>
      <circle cx="11" cy="13.15" r="0.65" fill="#ffffff" />
      <circle cx="13" cy="13.15" r="0.65" fill="#ffffff" />
    </svg>
  );
}

const TRYOUT_FRONT_PATH = "M2 10A1.7 1.7 0 0 1 3.7 8.3h16.6A1.7 1.7 0 0 1 22 10v8.3a1.7 1.7 0 0 1-1.7 1.7H3.7A1.7 1.7 0 0 1 2 18.3Z";

// Tryout-only: the same folder silhouette, but printed with diagonal white
// "notebook lines" across the front pocket instead of a face — matching
// the striped folder icon in the Tryout mockup. The stripes are clipped to
// the front-pocket path via a per-instance id (useId) so multiple folder
// cards on the same page don't collide on one shared <clipPath> id.
function FolderTryoutIcon(props: SVGProps<SVGSVGElement>) {
  const { style, ...rest } = props;
  const clipId = `tryout-folder-front-${useId()}`;
  return (
    <svg viewBox="0 0 24 24" {...rest} style={{ filter: "drop-shadow(0 3px 3px rgba(60, 70, 140, 0.35))", ...style }}>
      <defs>
        <clipPath id={clipId}>
          <path d={TRYOUT_FRONT_PATH} />
        </clipPath>
      </defs>
      <path
        d="M2 6.5A1.5 1.5 0 0 1 3.5 5h5.6l2.1 2.1h9.3A1.5 1.5 0 0 1 22 8.6V18.5A1.5 1.5 0 0 1 20.5 20h-17A1.5 1.5 0 0 1 2 18.5Z"
        fill="#ff8fb8"
      />
      <path d={TRYOUT_FRONT_PATH} fill="#ff6fae" />
      <g clipPath={`url(#${clipId})`} stroke="#ffffff" strokeOpacity={0.85} strokeWidth={0.9}>
        <line x1="-2" y1="24" x2="8" y2="6" />
        <line x1="2" y1="24" x2="12" y2="6" />
        <line x1="6" y1="24" x2="16" y2="6" />
        <line x1="10" y1="24" x2="20" y2="6" />
        <line x1="14" y1="24" x2="24" y2="6" />
        <line x1="18" y1="24" x2="28" y2="6" />
      </g>
    </svg>
  );
}

// Big, bold folder glyph used for the folder cards — the kawaii cat-face
// icon in kawaii, the striped icon in tryout, the plain classic pink icon
// in retro, a chunky filled outline otherwise.
export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.kawaii) return <FolderKawaiiIcon {...props} />;
  if (theme.tryout) return <FolderTryoutIcon {...props} />;
  if (theme.retro) return <FolderClassicIcon {...props} />;
  return <FolderLineIcon {...props} />;
}

function FileLineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6.5 3.5h7.4L18 8v11.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <path d="M13.7 3.5V8H18" />
    </svg>
  );
}

const FILE_BITMAP = ["01111000", "01001100", "01001010", "01001111", "01001111", "01001111", "01001111", "01111111"];

export function FileIcon(props: SVGProps<SVGSVGElement>) {
  const theme = useTheme();
  if (theme.retro || theme.kawaii) {
    return pixelGlyph(FILE_BITMAP, { ...props, style: { imageRendering: "pixelated", ...props.style } });
  }
  return <FileLineIcon {...props} />;
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5v11.6" />
      <path d="M7.2 10.8 12 15.6l4.8-4.8" />
      <path d="M4.5 18.5h15" />
    </svg>
  );
}

export function BackArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M14.3 4.7 19.3 9.7 8.8 20.2 4.3 21l0.8-4.5Z" />
      <line x1="12.7" y1="6.3" x2="17.7" y2="11.3" />
    </svg>
  );
}

// "Move up a level" — an arrow lifting out of a shallow tray, mirroring
// DownloadIcon's arrow-into-tray shape so the two read as opposites.
export function MoveUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 19V7.4" />
      <path d="M7.2 12.2 12 7.4l4.8 4.8" />
      <path d="M4.5 4.5h15" />
    </svg>
  );
}
