import { NextResponse } from "next/server";
import sharp from "sharp";
// no filesystem reads for overlays; fetch from public URL for hosting portability

export const runtime = "nodejs";

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const tryLine = line ? line + " " + w : w;
    if (tryLine.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = tryLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function normalizeText(text: string): string {
  const base = text
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "");
  const strip = process.env.VERCEL === "1" || process.env.STRIP_DIACRITICS === "1";
  if (!strip) return base;
  return base.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBottomTextSVG(title: string, width: number, height: number, padding: number, fontFaceCss?: string): Buffer {
  const contentWidth = width - padding * 2;
  const contentHeight = height - padding * 2;
  let fontSize = Math.round(Math.min(contentHeight * 0.25, 56));
  const maxChars = Math.max(16, Math.round(contentWidth / (fontSize * 0.55)));
  let lines = wrapText(normalizeText(title), maxChars);
  lines = lines.slice(0, 6);
  const lineHeight = Math.round(fontSize * 1.25);
  const totalTextHeight = lineHeight * lines.length;
  if (totalTextHeight > contentHeight) {
    fontSize = Math.max(24, Math.round(fontSize * (contentHeight / totalTextHeight)));
  }
  const lh = Math.round(fontSize * 1.25);
  const txtHeight = lh * lines.length;
  const startY = padding + Math.round((contentHeight - txtHeight) / 2) + fontSize;
  const tspans = lines
    .map((line, i) => `<tspan x="${Math.round(width / 2)}" y="${startY + i * lh}">${escapeXml(line)}</tspan>`)
    .join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
      ${fontFaceCss || ""}
      <text fill="#0b9ef9" font-size="${fontSize}" font-weight="700" text-anchor="middle" font-family="Segoe UI, Roboto, Arial, Helvetica, Verdana, system-ui, -apple-system, DejaVu Sans, Noto Sans, Liberation Sans, sans-serif">${tspans}</text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function getEmbeddedFontCss(sampleText: string): Promise<string | undefined> {
  try {
    const t = encodeURIComponent(sampleText.slice(0, 200));
    const cssRes = await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans:wght@700&display=swap&text=${t}`);
    if (!cssRes.ok) return undefined;
    const css = await cssRes.text();
    const m = css.match(/url\((https:[^\)]+\.woff2)\)/);
    if (!m) return undefined;
    const fontRes = await fetch(m[1]);
    if (!fontRes.ok) return undefined;
    const buf = Buffer.from(await fontRes.arrayBuffer());
    const b64 = buf.toString("base64");
    return `<style>@font-face{font-family:'EmbedFont';font-style:normal;font-weight:700;src:url(data:font/woff2;base64,${b64}) format('woff2');}</style>`;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const title = u.searchParams.get("title") || "";
  const imageUrl = u.searchParams.get("imageUrl");
  const format = (u.searchParams.get("format") || "post").toLowerCase();
  const transparent = u.searchParams.get("transparent") === "true";
  const dpiParam = u.searchParams.get("dpi");
  const dpi = dpiParam ? Math.max(72, Math.min(300, parseInt(dpiParam))) : 72;
  if (!imageUrl) {
    return NextResponse.json({ error: "Parâmetro imageUrl é obrigatório" }, { status: 400 });
  }
  let size = { width: 1080, height: 1350 };
  if (format === "square") size = { width: 1080, height: 1080 };
  else if (format === "post" || format === "portrait") size = { width: 1080, height: 1350 };
  else if (format === "widescreen") size = { width: 1920, height: 1080 };
  else if (format === "story") size = { width: 1080, height: 1920 };
  try {
    const res = await fetch(imageUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: u.origin,
      },
    });
    if (!res.ok) return NextResponse.json({ error: "Falha ao baixar imagem" }, { status: res.status });
    const buf = Buffer.from(await res.arrayBuffer());
    const canvas = sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png();
    const bg = await sharp(buf).resize(size.width, size.height, { fit: "cover" }).toBuffer();

    const overlayName = format === "story" ? "2.png" : "1.png";
    let overlay: Buffer | undefined;
    try {
      const xfProto = req.headers.get("x-forwarded-proto");
      const xfHost = req.headers.get("x-forwarded-host");
      const host = req.headers.get("host");
      const proto = xfProto || "https";
      const h = xfHost || host;
      const origin = h ? `${proto}://${h}` : u.origin;
      const overlayUrl = new URL(`/${overlayName}`, origin).toString();
      const overlayRes = await fetch(overlayUrl, { redirect: "follow" });
      if (overlayRes.ok) {
        overlay = Buffer.from(await overlayRes.arrayBuffer());
      }
    } catch { }

    const bottomHeight = Math.round(size.height * 0.3);
    const pad = Math.round(size.width * 0.05);
    const fontFaceCss = await getEmbeddedFontCss(title);
    const bottomTextSvg = buildBottomTextSVG(title, size.width, bottomHeight, pad, fontFaceCss);

    const composites: { input: Buffer; left: number; top: number }[] = [
      { input: bg, left: 0, top: 0 },
    ];
    if (overlay) composites.push({ input: overlay, left: 0, top: 0 });
    composites.push({ input: bottomTextSvg, left: 0, top: size.height - bottomHeight });
    const out = await canvas
      .composite(composites)
      .withMetadata({ density: dpi })
      .png()
      .toBuffer();
    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=0, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar imagem" }, { status: 500 });
  }
}
