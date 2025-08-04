// lib/blog-email-generator.js - Genera contenido de email desde blog posts
import { blogPosts, getPostBySlug } from '../data/blogPosts.js';

/**
 * Genera el contenido HTML para email de un blog post específico
 * @param {string} slug - El slug del blog post
 * @param {string} type - Tipo de email: 'individual', 'newsletter', 'digest'
 * @returns {object} - {subject, htmlContent, textContent}
 */
export const generateBlogEmailContent = (slug, type = 'individual') => {
  const post = getPostBySlug(slug);
  
  if (!post) {
    throw new Error(`Blog post no encontrado: ${slug}`);
  }

  // Generar contenido basado en el tipo
  switch (type) {
    case 'individual':
      return generateIndividualPostEmail(post);
    case 'newsletter':
      return generateNewsletterEmail(post);
    case 'digest':
      return generateDigestEmail([post]);
    default:
      throw new Error(`Tipo de email no válido: ${type}`);
  }
};

/**
 * Email individual para un post específico
 */
const generateIndividualPostEmail = (post) => {
  const subject = `📝 ${post.title}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; line-height: 1.3; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .excerpt { font-size: 16px; color: #555; margin-bottom: 25px; line-height: 1.5; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    .tag { display: inline-block; background: #e2e8f0; color: #4a5568; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">✍️ Letranido</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu comunidad de escritores</p>
    </div>
    
    <div class="content">
      <h2 class="title">${post.title}</h2>
      
      <div class="meta">
        📅 ${new Date(post.publishedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} • 
        ⏱️ ${post.readTime} • 
        🏷️ ${post.category}
      </div>
      
      <div class="excerpt">
        ${post.excerpt}
      </div>
      
      <div style="margin: 20px 0;">
        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      
      <a href="https://letranido.com/blog/${post.slug}" target="_blank" rel="noopener noreferrer" class="cta-button">
        📖 Leer artículo completo
      </a>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <h3 style="color: #4a5568; font-size: 18px;">¿Por qué te enviamos esto?</h3>
        <p style="color: #666; font-size: 14px;">
          Este artículo te ayudará a mejorar tu escritura y conectar mejor con nuestra comunidad de escritores.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Letranido</strong> - Tu plataforma de concursos de escritura</p>
      <p>
        <a href="https://letranido.com/contest/current" target="_blank" rel="noopener noreferrer" style="color: #667eea;">🏆 Ver concurso actual</a> • 
        <a href="https://letranido.com/blog" target="_blank" rel="noopener noreferrer" style="color: #667eea;">📝 Más artículos</a> • 
        <a href="https://letranido.com/profile/settings" target="_blank" rel="noopener noreferrer" style="color: #999;">Gestionar preferencias</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
${post.title}

${post.excerpt}

Leer más: https://letranido.com/blog/${post.slug}

Categoría: ${post.category}
Tiempo de lectura: ${post.readTime}
Tags: ${post.tags.join(', ')}

---
Letranido - Tu comunidad de escritores
🏆 Ver concurso actual: https://letranido.com/contest/current
📝 Más artículos: https://letranido.com/blog
⚙️ Gestionar preferencias: https://letranido.com/profile/settings
`;

  return {
    subject,
    htmlContent,
    textContent
  };
};

/**
 * Newsletter semanal con múltiples posts
 */
export const generateWeeklyNewsletter = () => {
  const recentPosts = blogPosts
    .filter(post => post.published)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);

  const subject = `📰 Newsletter Semanal - ${recentPosts.length} nuevos artículos`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Semanal - Letranido</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 20px; }
    .post-item { border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; overflow: hidden; }
    .post-header { padding: 20px 20px 10px 20px; }
    .post-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #2d3748; }
    .post-meta { color: #666; font-size: 13px; margin-bottom: 10px; }
    .post-excerpt { color: #555; font-size: 14px; margin-bottom: 15px; }
    .post-cta { background: #f7fafc; padding: 15px 20px; border-top: 1px solid #e2e8f0; }
    .read-more { color: #667eea; text-decoration: none; font-weight: 500; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">📰 Newsletter Semanal</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Lo mejor de la semana en Letranido</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 25px;">
        ¡Hola! Esta semana hemos publicado ${recentPosts.length} nuevos artículos que te ayudarán a mejorar tu escritura:
      </p>
      
      ${recentPosts.map(post => `
        <div class="post-item">
          <div class="post-header">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
              📅 ${new Date(post.publishedAt).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })} • 
              ⏱️ ${post.readTime} • 
              🏷️ ${post.category}
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
          </div>
          <div class="post-cta">
            <a href="https://letranido.com/blog/${post.slug}" target="_blank" rel="noopener noreferrer" class="read-more">
              📖 Leer artículo completo →
            </a>
          </div>
        </div>
      `).join('')}
      
      <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
        <h3 style="color: #0c4a6e; margin-top: 0;">🏆 ¡No te olvides del concurso!</h3>
        <p style="color: #0c4a6e; margin-bottom: 10px;">
          Pon en práctica lo que aprendes participando en nuestro concurso mensual.
        </p>
        <a href="https://letranido.com/contest/current" target="_blank" rel="noopener noreferrer" style="color: #0ea5e9; font-weight: 500;">
          Ver concurso actual →
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Letranido</strong> - Tu plataforma de concursos de escritura</p>
      <p>
        <a href="https://letranido.com/contest/current" target="_blank" rel="noopener noreferrer" style="color: #667eea;">🏆 Concursos</a> • 
        <a href="https://letranido.com/blog" target="_blank" rel="noopener noreferrer" style="color: #667eea;">📝 Blog</a> • 
        <a href="https://letranido.com/profile/settings" target="_blank" rel="noopener noreferrer" style="color: #999;">Gestionar preferencias</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
Newsletter Semanal - Letranido

Esta semana hemos publicado ${recentPosts.length} nuevos artículos:

${recentPosts.map(post => `
${post.title}
${post.excerpt}
Leer más: https://letranido.com/blog/${post.slug}
---
`).join('')}

🏆 No te olvides del concurso: https://letranido.com/contest/current

Letranido - Tu comunidad de escritores
🏆 Concursos: https://letranido.com/contest/current
📝 Blog: https://letranido.com/blog
⚙️ Gestionar preferencias: https://letranido.com/profile/settings
`;

  return {
    subject,
    htmlContent,
    textContent
  };
};

/**
 * Obtiene todos los posts publicados para selección
 */
export const getAvailablePosts = () => {
  return blogPosts
    .filter(post => post.published)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map(post => ({
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt,
      category: post.category,
      featured: post.featured
    }));
};

/**
 * Función de utilidad para preview rápido
 */
export const previewBlogEmail = (slug, type = 'individual') => {
  const content = generateBlogEmailContent(slug, type);
  console.log('📧 Preview del email:', content.subject);
  console.log('📄 Contenido:', content.textContent.substring(0, 200) + '...');
  return content;
};