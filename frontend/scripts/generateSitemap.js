import fs from 'fs';

const generateSitemap = () => {
  const baseUrl = 'https://www.cforge.live';

  const pages = [
    { path: '/', title: 'CForge - Competitive Coding Platform' },
    { path: '/login', title: 'Login - CForge' },
    { path: '/signup', title: 'Sign Up - CForge' },
    { path: '/dashboard', title: 'Dashboard - Track Your Coding Progress' },
    { path: '/rooms', title: 'Rooms - Join Coding Groups' },
    { path: '/profile', title: 'User Profile - CForge' },
    { path: '/settings', title: 'Settings - Manage Account' },
    { path: '/u/:username', title: 'User Profile - Competitive Coder' },
    { path: '/rooms/:roomId/leaderboard', title: 'Leaderboard - CForge Room' },
    { path: '/rooms/:roomId/chat', title: 'Room Chat - CForge' },
    { path: '/rooms/join/:inviteCode', title: 'Join Room - CForge' },
    { path: '/help', title: 'Help and FAQ - CForge' },
    { path: '/404', title: 'Page Not Found - CForge' }
  ];

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(page => `
      <url>
        <loc>${baseUrl}${page.path.replace(/:.*?/g, '')}</loc>
        <title>${page.title}</title>
        <changefreq>daily</changefreq>
        <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>
      </url>`).join('')}
  </urlset>`;

  fs.writeFileSync('./public/sitemap.xml', sitemapContent);
  console.log('✅ Sitemap with SEO Titles generated successfully!');
};

generateSitemap();