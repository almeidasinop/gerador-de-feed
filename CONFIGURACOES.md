# Gerador de Posts a partir de RSS

Projeto em Next.js que lê um feed RSS e gera imagens prontas para redes sociais com layout profissional, aplicando máscaras e título sobreposto.

## Recursos

- Lista os 10 últimos posts do feed RSS com imagem destacada `app/api/feed/route.ts:25`.
- Gera imagens com máscaras em dois formatos:
  - `post` 1080×1350 usando `public/1.png` `app/api/generate-image/route.ts:58-71`.
  - `story` 1080×1920 usando `public/2.png` `app/api/generate-image/route.ts:58-71`.
- Título em SVG com cor `#0b9ef9`, fonte sem serifa e padding lateral de 5% `app/api/generate-image/route.ts:31-36`.
- Página de pré-visualização com download e compartilhar `app/post/[id]/page.tsx:27`, `app/post/[id]/page.tsx:36`, `app/post/[id]/page.tsx:43`.

## Arquitetura

- App Router com layout e estilos globais:
  - `app/layout.tsx` `app/layout.tsx:18-34`
  - `app/globals.css` `app/globals.css:1`
- Home (lista de posts): `app/page.tsx` carrega `/api/feed` ao montar `app/page.tsx:15-28`.
- Página de post: exibe formatos e disponibiliza download/compartilhar `app/post/[id]/page.tsx:16-28`.

## APIs

- `GET /api/feed`
  - Usa `rss-parser` para ler o RSS (default ou via `?url=`) `app/api/feed/route.ts:27-29`.
  - Retorna `{ posts: Array<{ title, link, imageUrl }> }` `app/api/feed/route.ts:30-35`.
- `GET /api/generate-image`
  - Parâmetros: `title`, `imageUrl`, `format=post|story`, `dpi` opcional, `transparent` opcional `app/api/generate-image/route.ts:39-47`.
  - Composição: fundo (imagem do feed) + máscara (`public/1.png` ou `public/2.png`) + texto em SVG `app/api/generate-image/route.ts:58-71`.
  - Resposta: `image/png` com `density` conforme DPI.

## Configuração

- Variáveis de ambiente:
  - `RSS_FEED_URL` define o feed padrão `app/api/feed/route.ts:27`.
- Máscaras:
  - `public/1.png` (post) e `public/2.png` (story) lidas por caminho absoluto `app/api/generate-image/route.ts:55-57`.
- Runtime:
  - APIs forçadas para Node.js para compatibilidade com `sharp` e `fs` `app/api/generate-image/route.ts:4`, `app/api/feed/route.ts:3`.

## Desenvolvimento

- Instalar: `npm install`
- Servir: `npm run dev` e abrir `http://localhost:3000`
- Lint: `npm run lint`

## Uso Rápido

- Home: acessar `/` e clicar em um post para abrir a pré-visualização.
- Geração por URL:
  - Post: `/api/generate-image?title=...&imageUrl=...&format=post`
  - Story: `/api/generate-image?title=...&imageUrl=...&format=story`
  - Opcional: `&dpi=150`, `&transparent=true`

## Publicação

- Vercel
  - Importar o repositório e definir `RSS_FEED_URL`.
  - Build padrão do Next.js (`next build`).
- Outras plataformas: garantir Node.js com suporte ao `sharp`.
