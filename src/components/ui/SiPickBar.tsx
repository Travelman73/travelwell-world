import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useStore } from "@/store/useStore";
import { useSpecialInterests } from "@/store/useCatalog";
import { cx } from "@/lib/utils";

/**
 * Journey selection bar (Step 1 → Step 2). Fixed to the viewport bottom, slides
 * up when interests are chosen, and carries them forward to Regions. Uses the
 * shared .jn-selbar styling (journey.css) so it's fixed on every journey page —
 * not the home-scoped .si-pickbar.
 */
export function SiPickBar() {
  const { journeySIs, toggleSI } = useStore();
  const sis = useSpecialInterests();
  const show = journeySIs.length > 0;
  const n = journeySIs.length;

  return (
    <div className="jn-selbar" data-show={show} aria-live="polite" aria-hidden={!show} {...(show ? {} : ({ inert: "" } as any))} role="region" aria-label="Your chosen interests">
      <div className="jn-selbar__inner">
        <div className="jn-selbar__pills">
          {journeySIs.map((id) => {
            const si = sis.find((s) => s.id === id);
            return (
              <span key={id} className="jn-sel-pill">
                <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: si?.accent }} />
                {si?.name ?? id}
                <button aria-label={`Remove ${si?.name ?? id}`} onClick={() => toggleSI(id)}><Icon name="close" small /></button>
              </span>
            );
          })}
        </div>
        <div className={cx("jn-selbar__msg", n === 3 && "warn")}>
          {n >= 3 ? <><b>3 of 3</b> — that's the max. Fewer means a more focused trip.</>
            : n === 2 ? <><b>2 selected</b> — the sweet spot. ✨</>
            : <><b>1 selected</b> — add one more, or continue.</>}
        </div>
        <div className="jn-selbar__actions">
          <button className="btn btn-secondary" onClick={() => [...journeySIs].forEach((id) => toggleSI(id))}>Clear</button>
          <Link className="btn btn-primary" to="/regions">Choose a region →</Link>
        </div>
      </div>
    </div>
  );
}
