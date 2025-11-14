"use client";
import { useEffect, useState } from "react";

type Post = {
  title: string;
  link: string;
  imageUrl: string | null;
  date?: string | null;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sharedLinks, setSharedLinks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        const list: Post[] = data.posts || [];
        setPosts(list);
        const map: Record<string, boolean> = {};
        for (const p of list) {
          if (p.link && typeof window !== "undefined") {
            map[p.link] = !!localStorage.getItem(`shared:${p.link}`);
          }
        }
        setSharedLinks(map);
      } catch {
        setError("Falha ao carregar posts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (d?: string | null) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Últimos Posts</h1>
        {loading && (
          <p className="mt-6 text-zinc-600 dark:text-zinc-400">Carregando…</p>
        )}
        {error && (
          <p className="mt-6 text-red-600">{error}</p>
        )}
        {!loading && !error && (
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {posts.slice(0, 10).map((p, i) => {
              const href = `/post/${i}?title=${encodeURIComponent(p.title)}&imageUrl=${encodeURIComponent(p.imageUrl || "")}&link=${encodeURIComponent(p.link)}`;
              return (
                <li key={i} className="group rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {p.imageUrl ? (
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${p.imageUrl})` }} />
                    ) : (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Sem imagem</span>
                    )}
                    {sharedLinks[p.link] && (
                      <span className="absolute right-2 top-2 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white">Compartilhado</span>
                    )}
                  </div>
                  <a href={href} className="mt-3 block text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50">
                    {p.title}
                  </a>
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
                    Fonte
                  </a>
                  {p.date && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{fmt(p.date)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
