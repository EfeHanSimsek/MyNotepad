import DOMPurify from "dompurify";
import { marked } from "marked";

marked.use({
  gfm: true,
  breaks: true
});

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown.replace(/::callout\s(.+)\n([\s\S]*?)::/g, "<aside class=\"callout\"><strong>$1</strong><p>$2</p></aside>"), {
    async: false
  });
  const sanitized = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel"]
  });
  const template = document.createElement("template");
  template.innerHTML = sanitized;
  template.content.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    if (/^https?:\/\//i.test(href)) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
  });
  return template.innerHTML;
}

export function extractTitle(content: string): string {
  const heading = content.split("\n").find((line) => line.trim().startsWith("# "));
  return heading?.replace(/^#\s+/, "").trim() || "Başlıksız not";
}

export function extractBacklinks(content: string): string[] {
  return Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g)).map((match) => match[1].trim());
}

export function getReadingStats(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const characters = content.length;
  return {
    words,
    characters,
    readingMinutes: Math.max(1, Math.ceil(words / 220))
  };
}

export function insertMarkdownCommand(content: string, command: string): string {
  const snippets: Record<string, string> = {
    heading: "\n## Yeni başlık\n",
    table: "\n| Kolon | Değer |\n| --- | --- |\n| Örnek | İçerik |\n",
    task: "\n- [ ] Yeni görev\n",
    code: "\n```ts\n// kod\n```\n",
    callout: "\n::callout Bilgi\nÖnemli not.\n::\n",
    divider: "\n---\n",
    quote: "\n> Alıntı\n"
  };
  return `${content}${snippets[command] ?? ""}`;
}
