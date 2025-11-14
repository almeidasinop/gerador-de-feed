"use client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function PostPage() {
  const search = useSearchParams();
  const router = useRouter();
  const title = search.get("title") || "";
  const imageUrl = search.get("imageUrl") || "";
  const baseQuery = `title=${encodeURIComponent(title)}&imageUrl=${encodeURIComponent(imageUrl)}`;
  const portraitSrc = `/api/generate-image?${baseQuery}&format=post`;
  const storySrc = `/api/generate-image?${baseQuery}&format=story`;
  const share = async (url: string) => {
    try {
      const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ title, url });
      } else {
        window.open(url, "_blank");
      }
    } catch { }
  };
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Pré-visualizar e Baixar</h1>
          <button onClick={() => router.back()} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">Voltar</button>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <img src={portraitSrc} alt="Formato Post 1080x1350" width={1080} height={1350} className="w-full h-auto" />
            <div className="mt-3 flex gap-2">
              <a href={portraitSrc} download="post-1080x1350.png" className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black">Baixar</a>
              <button onClick={() => share(portraitSrc)} className="inline-block rounded-md border border-zinc-200 bg-white px-4 py-2 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">Compartilhar</button>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <img src={storySrc} alt="Formato Story 1080x1920" width={1080} height={1920} className="w-full h-auto" />
            <div className="mt-3 flex gap-2">
              <a href={storySrc} download="story-1080x1920.png" className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black">Baixar</a>
              <button onClick={() => share(storySrc)} className="inline-block rounded-md border border-zinc-200 bg-white px-4 py-2 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">Compartilhar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
