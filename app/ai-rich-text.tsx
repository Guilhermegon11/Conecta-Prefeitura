type AiTextBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  const cells = tableCells(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function listItem(line: string) {
  const match = line.match(/^\s*(?:(\d+)[.)]|[-*•])\s+(.+)$/);
  return match ? { ordered: Boolean(match[1]), text: match[2].trim() } : null;
}

function isBlockStart(lines: string[], index: number) {
  const line = lines[index]?.trim() ?? "";
  if (!line) return true;
  if (/^#{1,4}\s+/.test(line) || /^\*\*[^*]+\*\*$/.test(line) || /^\*\*[^*]+:\*\*/.test(line) || listItem(line)) return true;
  return line.startsWith("|") && Boolean(lines[index + 1]) && isTableSeparator(lines[index + 1]);
}

function parseAiText(content: string) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: AiTextBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    if (line.startsWith("|") && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        if (!isTableSeparator(lines[index])) rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const markdownHeading = line.match(/^(#{1,4})\s+(.+)$/);
    const boldHeading = line.match(/^\*\*([^*]+)\*\*$/);
    if (markdownHeading || boldHeading) {
      blocks.push({ type: "heading", level: markdownHeading?.[1].length ?? 3, text: (markdownHeading?.[2] ?? boldHeading?.[1] ?? "").trim() });
      index += 1;
      continue;
    }

    const firstListItem = listItem(line);
    if (firstListItem) {
      const ordered = firstListItem.ordered;
      const items: string[] = [];
      while (index < lines.length) {
        const item = listItem(lines[index]);
        if (!item || item.ordered !== ordered) break;
        items.push(item.text);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function renderInline(value: string) {
  return value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function fieldEmoji(label: string) {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("objetivo")) return "🎯";
  if (normalized.includes("acao")) return "✅";
  if (normalized.includes("responsavel")) return "👤";
  if (normalized.includes("prazo")) return "⏱️";
  if (normalized.includes("observ")) return "💡";
  return "📌";
}

function AiTableCards({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) return null;
  return <section className="municipal-ai-table-cards" aria-label="Informações organizadas">
    {rows.map((row, rowIndex) => {
      const step = row[0] || String(rowIndex + 1);
      const title = row[1] || headers[1] || "Tópico";
      return <article key={`${step}-${rowIndex}`}>
        <header><span>{step}</span><strong>{renderInline(title)}</strong></header>
        <dl>{headers.slice(2).map((header, cellIndex) => row[cellIndex + 2] ? <div key={`${header}-${cellIndex}`}><dt>{fieldEmoji(header)} {header}</dt><dd>{renderInline(row[cellIndex + 2])}</dd></div> : null)}</dl>
      </article>;
    })}
  </section>;
}

export function AiRichText({ content, compact = false }: { content: string; compact?: boolean }) {
  const blocks = parseAiText(content);
  return <div className={`municipal-ai-rich-text${compact ? " compact" : ""}`}>
    {blocks.map((block, index) => {
      if (block.type === "heading") return <h3 key={`heading-${index}`}>{renderInline(block.text)}</h3>;
      if (block.type === "paragraph") return <p key={`paragraph-${index}`}>{renderInline(block.text)}</p>;
      if (block.type === "list") {
        const Tag = block.ordered ? "ol" : "ul";
        return <Tag key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>)}</Tag>;
      }
      return <AiTableCards key={`table-${index}`} headers={block.headers} rows={block.rows} />;
    })}
  </div>;
}
