import fs from 'fs';
import path from 'path';

const generateSitemap = () => {
  const baseUrl = 'https://www.cforge.live';

  const pages = [
    { path: '/', title: 'CForge - Coding Platform Analytics | Track your coding progress and grow with your peers.' },
    { path: '/login', title: 'Login - CForge | Track your coding progress and grow with your peers.' },
    { path: '/signup', title: 'Sign Up - CForge | Track your coding progress and grow with your peers.' },
    { path: '/dashboard', title: 'Dashboard - Track Your Coding Progress' },
    { path: '/rooms', title: 'Rooms - Join Coding Groups' },
    { path: '/settings', title: 'Settings - Manage Account' },
    { path: '/help', title: 'Help and FAQ - CForge | Track your coding progress and grow with your peers.' },
    { path: '/about', title: 'About - CForge | Learn more about the platform' },
    { path: '/logout', title: 'Logout - CForge' },
    { path: '/contests-central', title: 'Contests - CForge Coding Contests Central' },
    { path: '/404', title: 'Page Not Found - CForge | Track your coding progress and grow with your peers.' }
  ];

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <!-- Title (not standard, just for readability or internal use) -->
    <title>${page.title}</title>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join('public', 'sitemap.xml'), sitemapContent);
  console.log('✅ Sitemap with SEO Titles generated successfully!');
};

generateSitemap();
