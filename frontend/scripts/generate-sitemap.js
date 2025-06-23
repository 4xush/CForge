import fs from 'fs';
import path from 'path';

const generateSitemap = () => {
  const baseUrl = 'https://www.cforge.live';

  // Define all discoverable pages for the sitemap
  const pages = [
    { path: '/' },
    { path: '/login' },
    { path: '/signup' },
    { path: '/dashboard' },
    { path: '/rooms' },
    { path: '/settings' },
    { path: '/help' },
    { path: '/about' },
    { path: '/logout' },
    { path: '/contest-central' }
  ];

  const currentDate = new Date().toISOString();

  // Construct valid sitemap XML content
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Ensure the public directory exists relative to the script location
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outputPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemapContent);

  console.log(`✅ Sitemap generated at ${outputPath}`);
};

generateSitemap();
