const fs = require('fs');
const path = require('path');

const publicIconsDir = path.resolve(__dirname, '../frontend/public/icons');
const githubIconsDir = path.resolve(__dirname, '../githubpage/icons');
const distIconsDir = path.resolve(__dirname, '../frontend/dist/icons');

fs.mkdirSync(publicIconsDir, { recursive: true });
fs.mkdirSync(githubIconsDir, { recursive: true });
fs.mkdirSync(distIconsDir, { recursive: true });

const icons = {
  chatgpt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#10a37f"/>
  <path fill="#ffffff" d="M70.5 44.5a13 13 0 0 0-.9-9.8 13.3 13.3 0 0 0-11.7-6.7 13.8 13.8 0 0 0-3.6.5 13.2 13.2 0 0 0-9.7-4.3 13.3 13.3 0 0 0-12.7 9.3 13.3 13.3 0 0 0-8.8 6.4 13.2 13.2 0 0 0 1.2 15.6 13 13 0 0 0 .9 9.8 13.3 13.3 0 0 0 11.7 6.7c1.2 0 2.4-.2 3.6-.5a13.2 13.2 0 0 0 9.7 4.3 13.3 13.3 0 0 0 12.7-9.3 13.3 13.3 0 0 0 8.8-6.4 13.2 13.2 0 0 0-1.2-15.6zm-17.7 28a9.4 9.4 0 0 1-5.8-2l3.4-2a6.4 6.4 0 0 0 7.8-1.4l5.3 3.1a9.5 9.5 0 0 1-10.7 2.3zm12-9.2a6.4 6.4 0 0 0-2.6-7.5l3.4-2a9.4 9.4 0 0 1 4.5 11.3 9.4 9.4 0 0 1-8.7 5.7c-.7 0-1.4-.1-2.1-.3l1.8-6.1a6.4 6.4 0 0 0 3.7-1.1zm3.8-14.7a9.4 9.4 0 0 1-1.1 12.2l-3.4-2a6.4 6.4 0 0 0-5.2-6.1V26.5a9.4 9.4 0 0 1 9.7 5.9zm-31.4 7.6a6.4 6.4 0 0 0 2.6 7.5l-3.4 2a9.4 9.4 0 0 1-4.5-11.3 9.4 9.4 0 0 1 8.7-5.7c.7 0 1.4.1 2.1.3l-1.8 6.1a6.4 6.4 0 0 0-3.7 1.1zm-3.8 14.7a9.4 9.4 0 0 1 1.1-12.2l3.4 2a6.4 6.4 0 0 0 5.2 6.1v6.2a9.4 9.4 0 0 1-9.7-5.9zm13.6-7.8l6.2-3.6 6.2 3.6v7.2l-6.2 3.6-6.2-3.6z"/>
</svg>`,
  netflix: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#000000"/>
  <path fill="#b81d24" d="M30 20h13v60H30z"/>
  <path fill="#b81d24" d="M57 20h13v60H57z"/>
  <path fill="#e50914" d="M30 20h13l27 60H57z"/>
</svg>`,
  spotify: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#121212"/>
  <circle cx="50" cy="50" r="36" fill="#1db954"/>
  <path fill="#ffffff" d="M33 41.5c12.2-2.4 24.3-.8 34.5 5.5a2.5 2.5 0 0 1-2.5 4.3c-9.2-5.6-20.2-7-31-4.8a2.5 2.5 0 0 1-1-4.9zm-1.5 11c10.5-2.2 21.3-.7 30 4.7a2.2 2.2 0 1 1-2.2 3.8c-7.8-4.8-17.5-6.1-27-4.1a2.2 2.2 0 1 1-.8-4.4zm1.5 11.2c8.8-1.8 17.8-.5 25.2 4a1.8 1.8 0 1 1-1.8 3.2c-6.5-4-14.5-5.1-22.3-3.5a1.8 1.8 0 0 1-1.1-3.6z"/>
</svg>`,
  canva: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="canvaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c4cc"/>
      <stop offset="50%" stop-color="#7d2ae8"/>
      <stop offset="100%" stop-color="#ff007a"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#canvaGrad)"/>
  <path fill="#ffffff" d="M57.6 37.5c-4.5 0-8.2 3.2-9.7 7.7-.5 1.5-.7 3.2-.7 5 0 8.4 5.6 14.3 13.6 14.3 4.2 0 7.8-1.8 9.9-4.7l-4.5-3.3c-1.3 1.6-3.1 2.6-5.4 2.6-4.6 0-7.8-3.3-8-8.1h18.8c.2-.9.3-1.8.3-2.8 0-6.2-4.8-10.7-14.3-10.7zm-4.7 10.3c.9-3.2 2.8-5 5.1-5 2.6 0 4.5 2 4.7 5h-9.8z" transform="translate(-8, -2) scale(1.15)"/>
</svg>`,
  windows: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#001428"/>
  <rect x="23" y="23" width="25" height="25" fill="#00a4ef" rx="3"/>
  <rect x="52" y="23" width="25" height="25" fill="#00a4ef" rx="3"/>
  <rect x="23" y="52" width="25" height="25" fill="#00a4ef" rx="3"/>
  <rect x="52" y="52" width="25" height="25" fill="#00a4ef" rx="3"/>
</svg>`,
  office: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1a0f00"/>
  <path fill="#eb3c00" d="M58 20L22 30v40l36 10 20-8V28z"/>
  <path fill="#ff8c00" d="M22 30l36 10v20L22 70z" opacity="0.9"/>
  <path fill="#ff5722" d="M58 20l20 8v44l-20 8z"/>
</svg>`,
  google: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#ffffff"/>
  <path fill="#4285F4" d="M73 50.8c0-1.8-.2-3.5-.5-5.1H50v9.7h13c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7-10.6 7-17.8z"/>
  <path fill="#34A853" d="M50 74.2c6.5 0 12-2.2 16-5.9l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.8h-8.1v6.2c4 8 12.3 13.2 21.5 13.2z"/>
  <path fill="#FBBC05" d="M36.6 54.8c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8v-6.2h-8.1c-1.7 3.3-2.6 7-2.6 11s.9 7.7 2.6 11l8.1-6.2z"/>
  <path fill="#EA4335" d="M50 35.4c3.6 0 6.7 1.2 9.2 3.6l6.9-6.9C61.9 28.3 56.4 26 50 26c-9.2 0-17.5 5.3-21.5 13.2l8.1 6.2c1.9-5.6 7.2-9.8 13.4-9.8z"/>
</svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1a0508"/>
  <rect x="20" y="28" width="60" height="44" rx="14" fill="#ff0000"/>
  <polygon points="45,40 62,50 45,60" fill="#ffffff"/>
</svg>`,
  capcut: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#000000"/>
  <path fill="#ffffff" d="M28 26l22 18-22 18V26zm44 0L50 44l22 18V26z" transform="translate(0, 7)"/>
  <rect x="28" y="46" width="44" height="8" rx="2" fill="#00f0ff"/>
</svg>`,
  duolingo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#183200"/>
  <circle cx="50" cy="50" r="32" fill="#58cc02"/>
  <circle cx="40" cy="46" r="9" fill="#ffffff"/>
  <circle cx="60" cy="46" r="9" fill="#ffffff"/>
  <circle cx="42" cy="46" r="5" fill="#4b4b4b"/>
  <circle cx="58" cy="46" r="5" fill="#4b4b4b"/>
  <path d="M45 56h10l-5 7z" fill="#ff9600"/>
</svg>`,
  vpn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#041e2a"/>
  <path d="M50 18l24 10v22c0 16-10.4 30.6-24 34-13.6-3.4-24-18-24-34V28z" fill="#00c9ff"/>
  <path d="M50 23v56.5c10.8-3.1 19-14.7 19-27.5V31.2z" fill="#0084ff"/>
  <circle cx="50" cy="48" r="8" fill="#ffffff"/>
  <rect x="47" y="48" width="6" height="14" rx="3" fill="#ffffff"/>
</svg>`,
  telegram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0b2238"/>
  <circle cx="50" cy="50" r="34" fill="#229ed9"/>
  <path d="M68 33L28 48.5c-2.7 1.1-2.7 2.6-.5 3.3l10.3 3.2 23.8-15c1.1-.7 2.1-.3 1.3.4L43.6 57.8l-.7 10.4c1.1 0 1.5-.5 2.1-1.1l5-4.8 10.4 7.7c1.9 1.1 3.3.5 3.8-1.7l6.8-32c.7-2.8-.9-4-3-3.3z" fill="#ffffff"/>
</svg>`,
  discord: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1e1f2b"/>
  <path fill="#5865F2" d="M73 28c-5.5-2.6-11.4-4.5-17.6-5.5-.8 1.4-1.7 3.3-2.3 4.8-6.6-1-13.2-1-19.8 0-.6-1.5-1.5-3.4-2.3-4.8-6.2 1-12.1 2.9-17.6 5.5-11.1 16.5-14.1 32.6-12.6 48.5 7.4 5.5 14.5 8.8 21.6 11 1.7-2.4 3.3-4.9 4.6-7.7-2.5-.9-4.9-2.1-7.1-3.6.6-.4 1.2-.9 1.8-1.3 14 6.5 29.1 6.5 43 0 .6.4 1.2.9 1.8 1.3-2.2 1.4-4.6 2.6-7.1 3.6 1.4 2.7 2.9 5.3 4.6 7.7 7.1-2.2 14.2-5.5 21.6-11 1.8-18.4-3.1-34.4-12.6-48.5zM38.3 60.5c-3.9 0-7.1-3.6-7.1-8s3.1-8 7.1-8 7.2 3.6 7.1 8-3.1 8-7.1 8zm23.4 0c-3.9 0-7.1-3.6-7.1-8s3.1-8 7.1-8 7.2 3.6 7.1 8-3.2 8-7.1 8z"/>
</svg>`,
  steam: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#171a21"/>
  <path fill="#66c0f4" d="M50 18A32 32 0 0 0 20.8 61.2l12.7-5.2a11.2 11.2 0 0 1 10.7-7.8c.8 0 1.6.1 2.3.3l12.5-18.1A14.4 14.4 0 1 1 67.2 46l-18.2 12.6c0 .5.1 1 .1 1.6a11.2 11.2 0 0 1-15 10.6L22.6 76A32 32 0 1 0 50 18zm14.4 17.6a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/>
</svg>`,
  adobe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#220005"/>
  <path fill="#fa0f00" d="M22 22h19.5L29 78h-7zm27.8 0H69l12 56H68.8l-4.5-12.5H53.5l8-22.3zm2.5 32.8h11.2l-5.6-15.6z"/>
</svg>`,
  apple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fc3c44"/>
      <stop offset="100%" stop-color="#f94c57"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#appleGrad)"/>
  <path fill="#ffffff" d="M68 30v27.2c-1.4-.7-3.1-1.2-5-1.2-5.5 0-10 4-10 9s4.5 9 10 9 10-4 10-9V38.5h8V30H68zm-22 36c-5.5 0-10 4-10 9s4.5 9 10 9 10-4 10-9V42L46 47v19z"/>
</svg>`,
  midjourney: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0d1117"/>
  <path fill="#ffffff" d="M42 22L20 62l22-10 18 26 20-56-38 18z" opacity="0.9"/>
  <circle cx="50" cy="50" r="10" fill="#00f0ff" opacity="0.8"/>
</svg>`,
  gemini: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1ba0e2"/>
      <stop offset="50%" stop-color="#9b51e0"/>
      <stop offset="100%" stop-color="#ff7b92"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="#050814"/>
  <path fill="url(#gemGrad)" d="M50 15C50 34.3 34.3 50 15 50c19.3 0 35 15.7 35 35 0-19.3 15.7-35 35-35-19.3 0-35-15.7-35-35z"/>
</svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#181717"/>
  <path fill="#ffffff" d="M50 20C33.4 20 20 33.4 20 50c0 13.3 8.6 24.5 20.6 28.5 1.5.3 2.1-.7 2.1-1.5v-5.2c-8.4 1.8-10.1-4-10.1-4-1.4-3.5-3.3-4.5-3.3-4.5-2.7-1.9.2-1.8.2-1.8 3 0.2 4.6 3.1 4.6 3.1 2.7 4.6 7.1 3.3 8.8 2.5 0.3-2 1.1-3.3 2-4.1-6.7-0.8-13.7-3.3-13.7-14.8 0-3.3 1.2-5.9 3.1-8-0.3-0.8-1.3-3.8 0.3-7.9 0 0 2.5-0.8 8.2 3.1 2.4-0.7 5-1 7.5-1s5.1 0.3 7.5 1c5.7-3.9 8.2-3.1 8.2-3.1 1.6 4.1 0.6 7.1 0.3 7.9 1.9 2.1 3.1 4.7 3.1 8 0 11.5-7 14-13.7 14.8 1.1 0.9 2.1 2.8 2.1 5.6v8.3c0 0.8 0.5 1.8 2.1 1.5C71.4 74.5 80 63.3 80 50c0-16.6-13.4-30-30-30z"/>
</svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0d1117"/>
  <path stroke="#58a6ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M36 36L22 50l14 14m28-28l14 14-14 14m-10-34l-8 40"/>
</svg>`,
  tool: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1e1e24"/>
  <circle cx="50" cy="50" r="24" stroke="#f59e0b" stroke-width="6" fill="none" stroke-dasharray="12 4"/>
  <circle cx="50" cy="50" r="10" fill="#f59e0b"/>
</svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1f1604"/>
  <polygon points="50,20 59,38 79,41 64,56 68,76 50,66 32,76 36,56 21,41 41,38" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
</svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1b120c"/>
  <circle cx="62" cy="38" r="15" stroke="#ff2453" stroke-width="6" fill="none"/>
  <path d="M51 49L26 74v8h8v-4h6v-4h6v-4l5-5" stroke="#ff2453" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`
};

for (const [name, svg] of Object.entries(icons)) {
  fs.writeFileSync(path.join(publicIconsDir, `${name}.svg`), svg, 'utf-8');
  fs.writeFileSync(path.join(githubIconsDir, `${name}.svg`), svg, 'utf-8');
  fs.writeFileSync(path.join(distIconsDir, `${name}.svg`), svg, 'utf-8');
}

console.log(`Generated ${Object.keys(icons).length} website icons in public, dist, and githubpage.`);
