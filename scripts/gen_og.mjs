import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/Users/matthewsabia1/affiliatetools-co/public/og';
fs.mkdirSync(OUT, { recursive: true });

// Default OG
const svgDefault = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f7f8fa"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0e2c5f"/>
      <stop offset="1" stop-color="#1e56a0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="12" fill="url(#accent)"/>

  <!-- Logo mark -->
  <g transform="translate(80, 80)">
    <rect width="56" height="56" rx="14" fill="#0e2c5f" opacity="0.12"/>
    <path d="M16 42 L28 16 L40 42 M22 34 H34" stroke="#0e2c5f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="152" y="117" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="28" fill="#0b1420" letter-spacing="-0.02em">AffiliateTools<tspan fill="#6b7487" font-weight="500">.co</tspan></text>

  <!-- Eyebrow -->
  <text x="80" y="256" font-family="ui-monospace, monospace" font-weight="500" font-size="20" fill="#0e2c5f" letter-spacing="2">INDEPENDENT REVIEWS</text>

  <!-- Headline -->
  <text x="80" y="336" font-family="-apple-system, system-ui, sans-serif" font-weight="740" font-size="78" fill="#0b1420" letter-spacing="-0.03em">The affiliate marketer's</text>
  <text x="80" y="416" font-family="-apple-system, system-ui, sans-serif" font-weight="740" font-size="78" fill="#0b1420" letter-spacing="-0.03em">software review library.</text>

  <!-- Subhead -->
  <text x="80" y="480" font-family="-apple-system, system-ui, sans-serif" font-weight="420" font-size="26" fill="#3f4a5a" letter-spacing="-0.005em">Hands-on reviews of ad spy tools, landing-page platforms, and</text>
  <text x="80" y="514" font-family="-apple-system, system-ui, sans-serif" font-weight="420" font-size="26" fill="#3f4a5a" letter-spacing="-0.005em">the software affiliate marketers actually run.</text>

  <!-- Footer -->
  <rect x="0" y="590" width="1200" height="1" fill="#e4e7eb"/>
  <text x="80" y="568" font-family="ui-monospace, monospace" font-weight="500" font-size="18" fill="#6b7487" letter-spacing="1">affiliatetools.co</text>
  <text x="1120" y="568" font-family="ui-monospace, monospace" font-weight="500" font-size="18" fill="#6b7487" letter-spacing="1" text-anchor="end">300,000+ ADS TRACKED</text>
</svg>`;

await sharp(Buffer.from(svgDefault))
  .png({ quality: 90 })
  .toFile(path.join(OUT, 'default.png'));

console.log('Wrote', path.join(OUT, 'default.png'));
