// middleware.js - Edge Middleware para Open Graph meta tags
// Se ejecuta en el edge de Vercel ANTES del rewrite a index.html
// Solo actúa cuando el visitor es un bot de redes sociales

export const config = {
  matcher: ['/microhistoria/:id', '/story/:id'],
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

async function fetchAuthorName(supabaseUrl, supabaseKey, userId) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=display_name`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) return 'Letranido';
    const profiles = await res.json();
    return profiles?.[0]?.display_name || 'Letranido';
  } catch {
    return 'Letranido';
  }
}

async function handleMicroStory(supabaseUrl, supabaseKey, storyId, baseUrl) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/feed_stories?id=eq.${storyId}&select=id,title,content,user_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!res.ok) return null;
  const stories = await res.json();
  if (!stories?.length) return null;

  const story = stories[0];
  const authorName = await fetchAuthorName(supabaseUrl, supabaseKey, story.user_id);

  const titleText = story.title || `Microhistoria de ${authorName}`;
  const description = story.content
    ? story.content.slice(0, 155).replace(/\n/g, ' ') + (story.content.length > 155 ? '…' : '')
    : `Una microhistoria de ${authorName} en Letranido`;

  return {
    title: titleText,
    description,
    url: `${baseUrl}/microhistoria/${story.id}`,
    image: `${baseUrl}/OG_image.png`,
    authorName,
  };
}

async function handleContestStory(supabaseUrl, supabaseKey, storyId, baseUrl) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/stories?id=eq.${storyId}&select=id,title,content,user_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!res.ok) return null;
  const stories = await res.json();
  if (!stories?.length) return null;

  const story = stories[0];
  const authorName = await fetchAuthorName(supabaseUrl, supabaseKey, story.user_id);

  const titleText = story.title || `Historia de ${authorName}`;
  const description = story.content
    ? story.content.slice(0, 155).replace(/\n/g, ' ') + (story.content.length > 155 ? '…' : '')
    : `Una historia de ${authorName} en Letranido`;

  return {
    title: titleText,
    description,
    url: `${baseUrl}/story/${story.id}`,
    image: `${baseUrl}/OG_image.png`,
    authorName,
  };
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  // Solo interceptar bots
  if (!isBot(userAgent)) {
    return; // undefined = continuar con el flujo normal (rewrite a index.html)
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const routeType = pathParts[1]; // 'microhistoria' o 'story'
  const storyId = pathParts[2];

  if (!storyId) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  try {
    const baseUrl = 'https://www.letranido.com';
    let ogData = null;

    if (routeType === 'microhistoria') {
      ogData = await handleMicroStory(supabaseUrl, supabaseKey, storyId, baseUrl);
    } else if (routeType === 'story') {
      ogData = await handleContestStory(supabaseUrl, supabaseKey, storyId, baseUrl);
    }

    if (!ogData) return;

    const html = buildOgHtml(ogData);

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
