# Configurações e Layout do Projeto

## Layout

- `app/layout.tsx` — Layout raiz do App Router (estrutura HTML e fontes) `app/layout.tsx:18-34`
- `app/globals.css` — Estilos globais e import do Tailwind `app/globals.css:1`
- `app/page.tsx` — Página Inicial com listagem dos posts e busca do feed `app/page.tsx:15`
- `app/post/[id]/page.tsx` — Página de pré-visualização e download das imagens `app/post/[id]/page.tsx:19`, `app/post/[id]/page.tsx:25`

## Feed (API)

- `app/api/feed/route.ts` — API que usa `rss-parser` para ler o RSS `app/api/feed/route.ts:25`, `app/api/feed/route.ts:29`
- Fonte do RSS: `process.env.RSS_FEED_URL` ou parâmetro `?url=` na requisição `app/api/feed/route.ts:27`
- Retorno: JSON com 10 itens `{ title, link, imageUrl }` `app/api/feed/route.ts:30-34`

## Geração de Imagem (API)

- `app/api/generate-image/route.ts` — API que usa `sharp` para compor imagem com título `app/api/generate-image/route.ts:39`
- Parâmetros: `title`, `imageUrl`, `format=post|story` `app/api/generate-image/route.ts:41-47`
- Tamanhos: `post` 1350x1080, `story` 1080x1920 `app/api/generate-image/route.ts:47`
- Scrim escuro e composição com SVG do texto `app/api/generate-image/route.ts:53-65`

## Variáveis de Ambiente

- `RSS_FEED_URL` — URL do feed RSS padrão usado pela API de Feed `app/api/feed/route.ts:27`

## Dependências e Scripts

- `package.json` — Scripts: `dev`, `build`, `start`, `lint` `package.json:6-9`
- `package.json` — Dependências principais: `next`, `react`, `rss-parser`, `sharp` `package.json:12-16`
- `package.json` — DevDependencies: `tailwindcss`, `eslint`, `typescript` `package.json:23-26`
- Tailwind habilitado em `app/globals.css` `app/globals.css:1`

## Execução

- Desenvolvimento: `npm run dev` (abre em `http://localhost:3000`)
- Lint e checagem: `npm run lint`

