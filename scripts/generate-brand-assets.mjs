import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd(), "public", "brand");

const iconSvg = readFileSync(resolve(root, "pwa-icon-source.svg"));

const iconTargets = [
  { file: "pwa-192.png", size: 192 },
  { file: "pwa-512.png", size: 512 },
  { file: "pwa-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" fill="#12304A"/>
  <g transform="translate(32 32) scale(0.8)">
    <rect x="6" y="17.5" width="9" height="18" rx="4.5" fill="#EAF4F7"/>
    <rect x="25" y="17.5" width="9" height="18" rx="4.5" fill="#EAF4F7"/>
    <circle cx="10.5" cy="12.5" r="3.75" fill="#EAF4F7"/>
    <circle cx="29.5" cy="12.5" r="3.75" fill="#EAF4F7"/>
    <path d="M10.5 25C10.5 10 29.5 10 29.5 25" stroke="#2FB3B5" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>
`;

const socialSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12304A"/>
      <stop offset="0.62" stop-color="#0F8B8D"/>
      <stop offset="1" stop-color="#2E9D68"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(96 168) scale(1.5)">
    <rect x="6" y="17.5" width="9" height="18" rx="4.5" fill="#EAF4F7"/>
    <rect x="25" y="17.5" width="9" height="18" rx="4.5" fill="#EAF4F7"/>
    <circle cx="10.5" cy="12.5" r="3.75" fill="#EAF4F7"/>
    <circle cx="29.5" cy="12.5" r="3.75" fill="#EAF4F7"/>
    <path d="M10.5 25C10.5 10 29.5 10 29.5 25" stroke="#EAF4F7" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="96" y="360" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="700" letter-spacing="-1.5" fill="#FFFFFF">CareBridge</text>
  <text x="96" y="430" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="500" fill="#EAF4F7" opacity="0.9">Learn to Care. Grow Your Career. Make a Difference.</text>
</svg>
`;

async function main() {
  for (const target of iconTargets) {
    const source =
      target.file === "pwa-maskable-512.png"
        ? Buffer.from(maskableSvg)
        : iconSvg;

    const png = await sharp(source)
      .resize(target.size, target.size, { fit: "contain" })
      .png()
      .toBuffer();

    writeFileSync(resolve(root, target.file), png);
  }

  const social = await sharp(Buffer.from(socialSvg)).png().toBuffer();
  writeFileSync(resolve(root, "social-share.png"), social);

  console.log("Brand PNG assets generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
