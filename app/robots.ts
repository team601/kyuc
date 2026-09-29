import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kyuc.alignlab.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/privacy',
          '/terms',
          '/security',
          '/share/*',
          '/images/*',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/story',
          '/story/*',
          '/profile',
          '/profile/*',
          '/family',
          '/family/*',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/auth/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
