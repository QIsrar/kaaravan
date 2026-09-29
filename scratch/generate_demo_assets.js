import fs from "fs";
import path from "path";

const targetDir = path.resolve(process.cwd(), "public/demo");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Colors from Kaaravan Design Language
const TEAL = "#0d484e";
const TEAL_LIGHT = "#15636b";
const GOLD = "#d99b26";
const SAND = "#f6f2e9";
const TERRACOTTA = "#c25438";
const CHARCOAL = "#20272b";

function makeCategorySvg(name, iconSymbol, color = TEAL) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${SAND}" />
      <stop offset="100%" stop-color="#eae2d2" />
    </linearGradient>
    <pattern id="motif" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.25" />
      <circle cx="20" cy="20" r="3" fill="${TERRACOTTA}" opacity="0.3" />
    </pattern>
  </defs>
  <rect width="400" height="300" fill="url(#bgGrad)" />
  <rect width="400" height="300" fill="url(#motif)" />
  <rect x="20" y="20" width="360" height="260" rx="16" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6,4" opacity="0.5" />
  
  <g transform="translate(200, 120)">
    <circle r="48" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="2" />
    <circle r="38" fill="${SAND}" stroke="${GOLD}" stroke-width="1.5" />
    <text text-anchor="middle" dominant-baseline="central" font-size="28" font-family="sans-serif">${iconSymbol}</text>
  </g>
  
  <g transform="translate(200, 215)">
    <rect x="-140" y="-18" width="280" height="36" rx="18" fill="#ffffff" stroke="${GOLD}" stroke-width="1.2" opacity="0.95" />
    <text text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="bold" font-size="14" fill="${CHARCOAL}" letter-spacing="0.5">${name.toUpperCase()}</text>
  </g>
</svg>`;
}

function makeBannerSvg(title, subtitle, tag, color = TEAL) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="100%" height="100%">
  <defs>
    <linearGradient id="bannerGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" />
      <stop offset="100%" stop-color="#072b2f" />
    </linearGradient>
    <pattern id="bannerTile" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.18" />
      <circle cx="30" cy="30" r="4" fill="${GOLD}" opacity="0.25" />
    </pattern>
  </defs>
  
  <rect width="1200" height="480" fill="url(#bannerGrad)" />
  <rect width="1200" height="480" fill="url(#bannerTile)" />
  
  <!-- Subtle border trim -->
  <rect x="24" y="24" width="1152" height="432" rx="20" fill="none" stroke="${GOLD}" stroke-width="2" stroke-opacity="0.4" />
  
  <g transform="translate(100, 140)">
    <!-- Tag -->
    <rect x="0" y="0" width="220" height="32" rx="16" fill="${TERRACOTTA}" />
    <text x="110" y="20" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff" letter-spacing="1.5">${tag}</text>
    
    <!-- Title -->
    <text x="0" y="80" font-family="sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="-0.5">${title}</text>
    
    <!-- Subtitle -->
    <text x="0" y="125" font-family="sans-serif" font-size="20" fill="${SAND}" opacity="0.9">${subtitle}</text>
    
    <!-- Button -->
    <rect x="0" y="160" width="200" height="48" rx="24" fill="${GOLD}" />
    <text x="100" y="190" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="15" fill="${CHARCOAL}">Discover Now →</text>
  </g>
  
  <!-- Geometric decorative medallion -->
  <g transform="translate(1020, 240)">
    <circle r="140" fill="none" stroke="${GOLD}" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8,6" />
    <circle r="110" fill="none" stroke="${SAND}" stroke-width="1" stroke-opacity="0.2" />
    <circle r="80" fill="${GOLD}" fill-opacity="0.1" stroke="${GOLD}" stroke-width="1.5" />
    <path d="M0 -70 L70 0 L0 70 L-70 0 Z" fill="none" stroke="${TERRACOTTA}" stroke-width="2" opacity="0.6" />
    <circle r="20" fill="${GOLD}" opacity="0.8" />
  </g>
</svg>`;
}

function makeProductSvg(title, categoryName, color = TEAL, price = "PKR 3,500") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="pGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="${SAND}" />
    </linearGradient>
    <pattern id="pGrid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${GOLD}" stroke-width="0.75" opacity="0.15" />
    </pattern>
  </defs>
  
  <rect width="600" height="600" fill="url(#pGrad)" />
  <rect width="600" height="600" fill="url(#pGrid)" />
  
  <!-- Decorative frame -->
  <rect x="25" y="25" width="550" height="550" rx="20" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.3" />
  
  <!-- Central Emblem Motif -->
  <g transform="translate(300, 260)">
    <circle r="150" fill="${color}" fill-opacity="0.08" />
    <circle r="120" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="10,6" opacity="0.4" />
    <polygon points="0,-90 64,-45 64,45 0,90 -64,45 -64,-45" fill="${color}" fill-opacity="0.15" stroke="${GOLD}" stroke-width="2" />
    <circle r="36" fill="${TERRACOTTA}" fill-opacity="0.9" />
    <circle r="18" fill="${GOLD}" />
  </g>
  
  <!-- Badges and Text -->
  <g transform="translate(300, 480)">
    <rect x="-180" y="-30" width="360" height="30" rx="15" fill="${color}" />
    <text text-anchor="middle" dominant-baseline="central" y="-15" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff" letter-spacing="1.2">${categoryName.toUpperCase()}</text>
    
    <text text-anchor="middle" y="24" font-family="sans-serif" font-weight="bold" font-size="18" fill="${CHARCOAL}">${title}</text>
    <text text-anchor="middle" y="52" font-family="sans-serif" font-weight="900" font-size="16" fill="${TERRACOTTA}">${price}</text>
  </g>
</svg>`;
}

function makeSellerLogoSvg(name, color = TEAL) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <rect width="200" height="200" rx="40" fill="${color}" />
  <circle cx="100" cy="100" r="75" fill="none" stroke="${GOLD}" stroke-width="3" stroke-dasharray="6,4" />
  <circle cx="100" cy="100" r="55" fill="${SAND}" />
  <text x="100" y="108" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="bold" font-size="32" fill="${color}">${name.charAt(0)}</text>
  <text x="100" y="175" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="10" fill="#ffffff" letter-spacing="1">VERIFIED VENDOR</text>
</svg>`;
}

// 1. Categories
const categories = [
  { file: "cat-apparel.svg", name: "Apparel & Textiles", icon: "👘", color: TEAL },
  { file: "cat-leather.svg", name: "Leather & Footwear", icon: "👞", color: TERRACOTTA },
  { file: "cat-home.svg", name: "Home & Pottery", icon: "🏺", color: TEAL_LIGHT },
  { file: "cat-spices.svg", name: "Spices & Organics", icon: "🌿", color: GOLD },
  { file: "cat-mens-traditional.svg", name: "Men's Traditional", icon: "👔", color: TEAL },
  { file: "cat-womens-artisanal.svg", name: "Women's Artisanal", icon: "🥻", color: TERRACOTTA },
  { file: "cat-handcrafted-footwear.svg", name: "Heritage Footwear", icon: "👡", color: TERRACOTTA },
  { file: "cat-blue-pottery.svg", name: "Multan Blue Pottery", icon: "🏺", color: TEAL },
  { file: "cat-brass-woodcraft.svg", name: "Brass & Woodcraft", icon: "🪵", color: GOLD },
  { file: "cat-pure-spices.svg", name: "Spices & Mountain Honey", icon: "🍯", color: GOLD },
];

categories.forEach(c => {
  fs.writeFileSync(path.join(targetDir, c.file), makeCategorySvg(c.name, c.icon, c.color));
});

// 2. Banners
const banners = [
  { file: "banner-caravan-1.svg", title: "Handcrafted Across Pakistan", subtitle: "Direct from master weavers, potters, and cobblers.", tag: "SEASON HIGHLIGHTS", color: TEAL },
  { file: "banner-caravan-2.svg", title: "Pure Mountain Harvests", subtitle: "Wild mountain honey, sun-dried apricots and saffron.", tag: "GILGIT & HUNZA", color: TEAL_LIGHT },
  { file: "banner-caravan-3.svg", title: "The Heritage Leatherwork", subtitle: "Genuine buffalo leather Kaptaan & Norozi Chappals.", tag: "PESHAWAR CRAFT", color: "#6e2a1b" },
];

banners.forEach(b => {
  fs.writeFileSync(path.join(targetDir, b.file), makeBannerSvg(b.title, b.subtitle, b.tag, b.color));
});

// 3. Sellers
const sellers = [
  { file: "seller-kashikari.svg", name: "Multan Kashikari", color: TEAL },
  { file: "seller-peshawar-leather.svg", name: "Khyber Heritage", color: TERRACOTTA },
  { file: "seller-hunza-organics.svg", name: "Hunza Organics", color: "#2d5a27" },
];

sellers.forEach(s => {
  fs.writeFileSync(path.join(targetDir, s.file), makeSellerLogoSvg(s.name, s.color));
});

// 4. Products (40 products)
for (let i = 1; i <= 40; i++) {
  const color = i % 3 === 0 ? TERRACOTTA : i % 2 === 0 ? TEAL : GOLD;
  const pSvg = makeProductSvg(`Artisanal Craft #${i}`, `Heritage Item`, color, `PKR ${(2000 + i * 250).toLocaleString()}`);
  fs.writeFileSync(path.join(targetDir, `prod-${i}.svg`), pSvg);
  // Also alternate angle image for detail gallery
  const pDetailSvg = makeProductSvg(`Artisanal Craft #${i} (Detail)`, `Close-up View`, color, `PKR ${(2000 + i * 250).toLocaleString()}`);
  fs.writeFileSync(path.join(targetDir, `prod-${i}-detail.svg`), pDetailSvg);
}

console.log("Successfully generated all demo SVG assets in public/demo/");
