// middleware.js - Edge Middleware para Open Graph meta tags en microhistorias
// Se ejecuta en el edge de Vercel ANTES del rewrite a index.html
// Solo actúa cuando el visitor es un bot de redes sociales

export const config = {
  matcher: ['/microhistoria/:id'],
};

// User-agents de bots de redes sociales y scrapers OG
const BOT_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'whatsapp',
  'telegrambot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'pinterest',
  'googlebot',
  'bingbot',
  'applebot',
  'ia_archiver',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((bot) => ua.includes(bot));
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml({ title, description, url, image, authorName }) {
  const siteTitle = `${escapeHtml(title)} | Letranido`;
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image);
  const safeAuthor = escapeHtml(authorName);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${siteTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="author" content="${safeAuthor}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Letranido" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:title" content="${siteTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="es_ES" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@letranido" />
  <meta name="twitter:title" content="${siteTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Redirect para usuarios que lleguen directo -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
</head>
<body>
  <p>Redirigiendo a <a href="${safeUrl}">la historia</a>...</p>
</body>
</html>`;
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  // Solo interceptar bots
  if (!isBot(userAgent)) {
    return; // undefined = continuar con el flujo normal (rewrite a index.html)
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const storyId = pathParts[pathParts.length - 1];

  if (!storyId) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  try {
    // Cargar historia
    const storyRes = await fetch(
      `${supabaseUrl}/rest/v1/feed_stories?id=eq.${storyId}&select=id,title,content,user_id,word_count`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!storyRes.ok) return;
    const stories = await storyRes.json();
    if (!stories?.length) return;

    const story = stories[0];

    // Cargar nombre del autor
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${story.user_id}&select=display_name`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let authorName = 'Letranido';
    if (profileRes.ok) {
      const profiles = await profileRes.json();
      if (profiles?.length) authorName = profiles[0].display_name || authorName;
    }

    const baseUrl = 'https://www.letranido.com';
    const storyUrl = `${baseUrl}/microhistoria/${story.id}`;
    const image = `${baseUrl}/OG_image.png`;

    const titleText = story.title
      ? story.title
      : `Microhistoria de ${authorName}`;

    // Descripción: primeros 155 chars del contenido
    const description = story.content
      ? story.content.slice(0, 155).replace(/\n/g, ' ') + (story.content.length > 155 ? '…' : '')
      : `Una microhistoria de ${authorName} en Letranido`;

    const html = buildOgHtml({
      title: titleText,
      description,
      url: storyUrl,
      image,
      authorName,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    // Si falla cualquier cosa, dejar pasar normal
    return;
  }
}
