import { NextResponse } from "next/server";
import Parser from "rss-parser";
export const runtime = "nodejs";

type FeedItem = {
    title: string;
    link: string;
    imageUrl: string | null;
};

const parser = new Parser();

function findBestImageFromHtml(html: string): string | null {
    const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
    if (!matches.length) return null;
    let best = matches[0][1];
    let bestScore = 0;
    for (const m of matches) {
        const tag = m[0];
        const src = m[1];
        const wMatch = tag.match(/width=["'](\d+)["']/i);
        const hMatch = tag.match(/height=["'](\d+)["']/i);
        const w = wMatch ? parseInt(wMatch[1], 10) : 0;
        const h = hMatch ? parseInt(hMatch[1], 10) : 0;
        const score = Math.max(w, h);
        if (score > bestScore) {
            bestScore = score;
            best = src;
        }
    }
    return best;
}

function extractImage(item: Record<string, unknown>): string | null {
    const contentEncoded = item["content:encoded"] as string | undefined;
    if (contentEncoded) {
        const img = findBestImageFromHtml(contentEncoded);
        if (img) return img;
    }
    const description = item["description"] as string | undefined;
    if (description) {
        const img = findBestImageFromHtml(description);
        if (img) return img;
    }
    const enclosure = item["enclosure"] as { url?: string } | undefined;
    if (enclosure?.url) return enclosure.url;
    const media = item["media:content"] as { url?: string; $?: { url?: string } } | undefined;
    const mediaUrl = media?.url || media?.$?.url;
    if (mediaUrl) return mediaUrl;
    return null;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = process.env.RSS_FEED_URL || searchParams.get("url") || "https://lavemnoticia.com/feed/";
    try {
        const feed = await parser.parseURL(url);
        const posts: FeedItem[] = (feed.items || []).slice(0, 10).map((item) => ({
            title: (item as Record<string, unknown>)["title"] as string || "",
            link: (item as Record<string, unknown>)["link"] as string || "",
            imageUrl: extractImage(item as unknown as Record<string, unknown>),
        }));
        return NextResponse.json({ posts });
    } catch {
        return NextResponse.json({ error: "Falha ao carregar o feed" }, { status: 500 });
    }
}

