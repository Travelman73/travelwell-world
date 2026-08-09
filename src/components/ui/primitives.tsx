/**
 * TravelWell.World — UI primitives built on the settled design-token classes
 * (.btn, .pill, .safety-chip, .ftc, .icon-chip, .card …). These keep screens
 * pixel-faithful to the prototype while staying composable in React.
 */
import { Link } from "react-router-dom";
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes, CSSProperties } from "react";
import { Icon } from "@/lib/icons";
import { cx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "gold" | "ghost";
const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  gold: "btn-gold",
  ghost: "btn-ghost",
};

/** Internal-route button. */
export function ButtonLink({
  to, variant = "primary", className, children, ...rest
}: { to: string; variant?: Variant } & AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <Link to={to} className={cx("btn", variantClass[variant], className)} {...rest}>
      {children}
    </Link>
  );
}

/** Action button (no navigation). */
export function Button({
  variant = "primary", className, children, ...rest
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx("btn", variantClass[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export type PillKind = "live" | "preview" | "soon" | "gold" | "engine";
/** Live vs Preview trust pill (Trust Language). */
export function Pill({ kind, children, className }: { kind: PillKind; children?: ReactNode; className?: string }) {
  return <span className={cx("pill", `pill-${kind}`, className)}>{children}</span>;
}

/** Status → pill kind + label, straight about live/preview/soon. */
export function StatusPill({ status }: { status: "live" | "preview" | "soon" }) {
  if (status === "live") return <Pill kind="live">Live</Pill>;
  if (status === "soon") return <Pill kind="soon">Activated at Launch</Pill>;
  return <Pill kind="preview">Preview</Pill>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("eyebrow", className)}>{children}</span>;
}

/** Pine glyph in a sage-mist rounded square. */
export function IconChip({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cx("icon-chip", className)}>
      <Icon name={name} />
    </div>
  );
}

/** Safety Card chip — color is ALWAYS paired with a number + label. */
const SAFETY_LABEL: Record<number, string> = {
  1: "Normal precautions",
  2: "Increased caution",
  3: "Reconsider travel",
  4: "Do not travel",
};
export function SafetyChip({ level, label }: { level: 1 | 2 | 3 | 4; label?: string }) {
  return (
    <span className={cx("safety-chip", `safety-${level}`)}>
      <span className="lvl">{level}</span>
      {label || SAFETY_LABEL[level]}
    </span>
  );
}

/** FTC affiliate disclosure — adjacent to monetized CTAs, never hidden. */
export function Ftc({ children, className, style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <p className={cx("ftc", className)} style={style}>
      <Icon name="info" small />
      {children || "Booking this may earn us a commission, at no extra cost to you. Disclosed every time."}
    </p>
  );
}

export function Card({ children, className, isPreview }: { children: ReactNode; className?: string; isPreview?: boolean }) {
  return <div className={cx("card", isPreview && "is-preview", className)}>{children}</div>;
}

/**
 * Brand slogan (David-locked system): "If It's {subject}… TravelWell."
 * Ends in the one-word brand mark ("Well" accented, mirroring the logo) plus the
 * ™. English-only — a coined brand line, and the wording must be EXACT: the
 * ellipsis is part of the mark, a variant is a different mark.
 */
export function Tagline({ subject, className }: { subject: string; className?: string }) {
  return (
    <p className={cx("tagline", className)}>
      If It&rsquo;s {subject}&hellip;{" "}
      <span className="tagline__mark">
        Travel<span className="tagline__well">Well</span>
        <span className="tagline__tm" aria-hidden="true">&trade;</span>
      </span>
    </p>
  );
}

/**
 * The one-word brand mark for sign-offs — `TravelWell™`, or `TravelWell.World™`.
 *
 * Trademark discipline (attorney, 2026-08): the mark is ONE word, always. The
 * two-word "Travel Well." pun that used to close these lines was retired
 * everywhere — a variant is a different mark, and using it weakens the claim.
 * Rendered through this component so the wording can never drift again.
 */
export function BrandMark({ world = false }: { world?: boolean }) {
  return (
    <>
      TravelWell{world ? ".World" : ""}
      <span className="tw-tm" aria-hidden="true">&trade;</span>
    </>
  );
}
