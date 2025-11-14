import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const sizeParam = u.searchParams.get("size");
  const size = sizeParam ? Math.max(48, Math.min(1024, parseInt(sizeParam))) : 192;
  try {
    const xfProto = req.headers.get("x-forwarded-proto");
    const xfHost = req.headers.get("x-forwarded-host");
    const host = req.headers.get("host");
    const proto = xfProto || "https";
    const h = xfHost || host;
    const origin = h ? `${proto}://${h}` : u.origin;
    const logoUrl = new URL("/logo.png", origin).toString();
    const res = await fetch(logoUrl, { redirect: "follow" });
    if (!res.ok) return NextResponse.json({ error: "Logo não encontrada" }, { status: res.status });
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await sharp(buf)
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();
    return new NextResponse(new Uint8Array(out), { headers: { "Content-Type": "image/png" } });
  } catch {
    return NextResponse.json({ error: "Falha ao gerar ícone" }, { status: 500 });
  }
}