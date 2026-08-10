/**
 * TravelWell.World — Inline SVG icon set (one source of truth).
 * Ported from TWW.ICON / TWW.P in js/shell.js. Stroke icons on a 24×24 grid.
 */
import type { CSSProperties } from "react";

export const ICON_PATHS: Record<string, string> = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-2 5-3 1.5 2-5z"/>',
  plane: '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>',
  bed: '<path d="M3 18v-6h18v6M3 12V7m18 5V9a2 2 0 0 0-2-2H8v5M3 18v2m18-2v2"/>',
  utensils: '<path d="M4 3v7a2 2 0 0 0 4 0V3M6 11v10M18 3c-1.5 0-3 1.5-3 5s1.5 4 3 4m0-9v18"/>',
  car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v3h2m12-5a2 2 0 0 1 2 2v3h-2M7 16h10M6.5 16v2m11-2v2"/>',
  bag: '<path d="M6 7V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1m-13 0h14l-1 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 .3.0M5 18l.6 1.6"/>',
  gift: '<path d="M20 12v8H4v-8M2 8h20v4H2zM12 8v12M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z"/>',
  shield: '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8"/>',
  heart: '<path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  send: '<path d="M4 12l16-7-7 16-2-7z"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
  sos: '<path d="M12 2l2.5 5 5.5.8-4 3.9 1 5.5L12 20l-5 2.6 1-5.5-4-3.9 5.5-.8z" fill="none"/><path d="M12 9v4M12 16h.01"/>',
  cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  hospital: '<path d="M4 21V8l8-5 8 5v13M9 21v-5h6v5M12 8v4M10 10h4"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
  bag2: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  read: '<path d="M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  check: '<path d="M5 12l5 5L20 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  // Pet Safety's glyph. The safety stack rests unlabelled, so its two green
  // buttons must be tellable apart by shape alone — two identical crosses aren't.
  paw: '<circle cx="7" cy="10.5" r="1.9"/><circle cx="11" cy="7.6" r="2"/><circle cx="15.4" cy="8" r="2"/><circle cx="18.8" cy="11.6" r="1.9"/><path d="M12.6 12.4c-2.2 0-4.1 1.7-4.8 3.5-.6 1.7.5 3.3 2.2 3.3.9 0 1.7-.3 2.6-.3s1.7.3 2.6.3c1.7 0 2.8-1.6 2.2-3.3-.7-1.8-2.6-3.5-4.8-3.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2m20 0h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  message: '<path d="M4 5h16v11H8l-4 4z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

export type IconKey = keyof typeof ICON_PATHS;

export interface IconProps {
  name: string;
  className?: string;
  small?: boolean;
  style?: CSSProperties;
}

/** Renders one icon from the set. Mirrors `TWW.ICON(name, cls)`. */
export function Icon({ name, className = "", small = false, style }: IconProps) {
  const cls = ["ic", small ? "ic-sm" : "", className].filter(Boolean).join(" ");
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }}
    />
  );
}
