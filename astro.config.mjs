import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL = 'https://affiliatetools.co';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname.replace(/\/+$/, '/');

        if (path === '/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (path === '/ad-spy-tools/') {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        if (path.match(/^\/ad-spy-tools\/[a-z0-9-]+-review\/$/)) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        if (path.match(/^\/ad-spy-tools\/adrecon-vs-[a-z0-9-]+\/$/)) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        if (path.match(/^\/ad-spy-tools\/best-|^\/ad-spy-tools\/[a-z0-9-]+-alternatives/)) {
          return { ...item, priority: 0.7, changefreq: 'monthly' };
        }
        return { ...item, priority: 0.5, changefreq: 'monthly' };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
