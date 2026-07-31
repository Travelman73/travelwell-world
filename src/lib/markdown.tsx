/**
 * TravelWell.World — tiny, safe markdown for Atlas's chat replies.
 *
 * Atlas answers in light markdown (**bold**, *italic*, `code`, bullet / numbered
 * lists, [links](url)). The chat bubble was showing it raw, so asterisks leaked
 * on screen. This renders that subset — and ONLY that subset — as React elements.
 *
 * Safety: we never use dangerouslySetInnerHTML and never emit raw HTML. Text is
 * placed into React nodes (auto-escaped), and links are whitelisted to http(s)
 * only. There is no injection surface, so no sanitizer dependency is needed.
 *
 * Deliberately small: no tables, headings-as-#, blockquotes, or nested code
 * fences — Atlas doesn't use them in voice-length replies. Add here if that
 * changes; don't reach for a 50KB parser for four inline rules.
 */
import type { ReactNode } from "react";

// Inline: **bold** / __bold__, *italic* / _italic_, `code`, [text](http…). Bold
// is matched before italic (its `**` wins over a single `*`). Recurses so a bold
// span can hold italic, etc.
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+?)`|\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) out.push(<strong key={k}>{inline(m[2], k)}</strong>);
    else if (m[3]) out.push(<em key={k}>{inline(m[4], k)}</em>);
    else if (m[5]) out.push(<code key={k}>{m[5]}</code>);
    else if (m[6]) out.push(<a key={k} href={m[7]} target="_blank" rel="noopener noreferrer">{m[6]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Render light markdown to React nodes (block-aware: paragraphs + lists). */
export function renderMarkdown(src: string): ReactNode {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const key = `p${blocks.length}`;
    blocks.push(<p key={key}>{inline(para.join(" "), key)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const key = `l${blocks.length}`;
    const items = list.items.map((it, ix) => <li key={ix}>{inline(it, `${key}-${ix}`)}</li>);
    blocks.push(list.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(ul[1]);
    } else if (ol) {
      flushPara();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(ol[1]);
    } else if (line.trim() === "") {
      flushPara(); flushList();
    } else {
      flushList();
      // A leading "# " heading just becomes emphasized text (no giant <h1> in a bubble).
      para.push(line.replace(/^#{1,6}\s+/, ""));
    }
  }
  flushPara(); flushList();
  return <>{blocks}</>;
}

/** Flatten markdown to plain text for TTS — so the voice never says "star star". */
export function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
