import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dawrash City',
    short_name: 'Dawrash',
    description: 'An exclusive land ownership programme for registered members of Gospel Labour Ministry.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F1923',
    theme_color: '#0F1923',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
