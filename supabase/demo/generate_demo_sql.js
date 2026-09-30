import fs from "fs";
import path from "path";

const productsList = [
  // Seller 1: Multan Kashikari & Crafts (14 products)
  {
    title: "Multani Handcrafted Blue Pottery Flower Vase (Kashikari 10\")",
    slug: "multani-handcrafted-blue-pottery-flower-vase-10-inch",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Authentic Multan Blue Pottery flower vase featuring intricate Persian Kashikari hand-painted floral motifs. Baked in traditional wood-fired kilns using lead-free cobalt glaze. Each piece is individually crafted by master potters of Multan.",
    ratingAvg: 4.90,
    ratingCount: 28,
    variants: [
      { sku: "MK-VASE-10-COBALT", title: "Cobalt Blue - 10 inch", attributes: { color: "Cobalt Blue", size: "10 inch" }, price: 345000, compareAt: 420000, stock: 18 },
      { sku: "MK-VASE-12-TURQ", title: "Turquoise - 12 inch", attributes: { color: "Turquoise", size: "12 inch" }, price: 465000, compareAt: 550000, stock: 12 },
    ]
  },
  {
    title: "Chinioti Hand-Carved Sheesham Wood Serving Tray Set",
    slug: "chinioti-hand-carved-sheesham-wood-serving-tray-set",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "chiniot-heritage",
    description: "Nest of two hand-carved serving trays crafted from seasoned Chinioti Sheesham (Dalbergia sissoo) rosewood. Embellished with brass inlay filigree work and polished with natural beeswax for a durable satin finish.",
    ratingAvg: 4.85,
    ratingCount: 19,
    variants: [
      { sku: "CH-TRAY-SET2", title: "Set of 2 (Medium + Large)", attributes: { set: "Set of 2", wood: "Sheesham" }, price: 580000, compareAt: 690000, stock: 15 },
      { sku: "CH-TRAY-SET3", title: "Set of 3 (Full Nesting Set)", attributes: { set: "Set of 3", wood: "Sheesham" }, price: 790000, compareAt: 950000, stock: 9 },
    ]
  },
  {
    title: "Multani Traditional Glazed Ceramic Chai Mugs (Set of 6)",
    slug: "multani-traditional-glazed-ceramic-chai-mugs-set-of-6",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Six handmade tea mugs finished in classic Multan cobalt blue and white glazed ceramic. High-fired for thermal shock resistance, perfect for daily karak chai and traditional kahwa.",
    ratingAvg: 4.95,
    ratingCount: 42,
    variants: [
      { sku: "MK-MUG-SET6-BLUE", title: "Royal Blue Glaze (Set of 6)", attributes: { set: "6 Mugs", color: "Royal Blue" }, price: 285000, compareAt: 350000, stock: 35 },
      { sku: "MK-MUG-SET6-TERRA", title: "Terracotta Earth Glaze (Set of 6)", attributes: { set: "6 Mugs", color: "Terracotta" }, price: 285000, compareAt: 350000, stock: 20 },
    ]
  },
  {
    title: "Multan Hand-Painted Camel Skin Table Lamp (Naqqashi Art)",
    slug: "multan-hand-painted-camel-skin-table-lamp",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Famous Multani camel skin table lamp painted with intricate Mughal Naqqashi lacquered miniature artwork. Casts a warm, enchanting golden glow when illuminated. Fitted with brass holder and standard E14 bulb socket.",
    ratingAvg: 4.80,
    ratingCount: 14,
    variants: [
      { sku: "MK-LAMP-S", title: "Small (10 inch)", attributes: { size: "10 inch" }, price: 420000, compareAt: 490000, stock: 10 },
      { sku: "MK-LAMP-M", title: "Medium (14 inch)", attributes: { size: "14 inch" }, price: 620000, compareAt: 750000, stock: 8 },
      { sku: "MK-LAMP-L", title: "Large (18 inch)", attributes: { size: "18 inch" }, price: 890000, compareAt: 1050000, stock: 5 },
    ]
  },
  {
    title: "Hand-Hammered Solid Copper Chai Degchi (2 Litre)",
    slug: "hand-hammered-solid-copper-chai-degchi-2-litre",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "lahore-weavers",
    description: "Traditional solid copper chai kettle hand-hammered by artisan coppersmiths. Tinned inside with pure food-grade kalai. Excellent thermal conductivity for preparing aromatic Kashmiri chai and strong dhood patti.",
    ratingAvg: 4.90,
    ratingCount: 22,
    variants: [
      { sku: "CU-DEGCHI-2L", title: "2 Litre Capacity", attributes: { capacity: "2 Litre", material: "Pure Copper" }, price: 540000, compareAt: 650000, stock: 16 },
      { sku: "CU-DEGCHI-3.5L", title: "3.5 Litre Capacity", attributes: { capacity: "3.5 Litre", material: "Pure Copper" }, price: 720000, compareAt: 880000, stock: 10 },
    ]
  },
  {
    title: "Kashikari Blue Pottery Round Serving Platter (14\")",
    slug: "kashikari-blue-pottery-round-serving-platter-14-inch",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Grand circular wall display and banquet serving platter with symmetrical star and rosette arabesque motifs. Includes pre-drilled wall hanging slots on the underside.",
    ratingAvg: 4.75,
    ratingCount: 16,
    variants: [
      { sku: "MK-PLAT-14", title: "14-Inch Banquet Platter", attributes: { diameter: "14 inch", style: "Star Arabesque" }, price: 380000, compareAt: 450000, stock: 14 },
    ]
  },
  {
    title: "Chinioti Brass Inlay Wooden Coaster Set (Hexagonal, 6 Pcs)",
    slug: "chinioti-brass-inlay-wooden-coaster-set-hexagonal",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "chiniot-heritage",
    description: "Set of six solid sheesham wood coasters housed in a matching handcrafted hexagonal holder with ornate Pakistani brass wire inlays.",
    ratingAvg: 4.88,
    ratingCount: 31,
    variants: [
      { sku: "CH-COAST-HEX6", title: "Set of 6 with Holder", attributes: { quantity: "6 Coasters", shape: "Hexagon" }, price: 175000, compareAt: 220000, stock: 40 },
    ]
  },
  {
    title: "Gujranwala Heavy Brass Imam Dasta (Mortar & Pestle)",
    slug: "gujranwala-heavy-brass-imam-dasta-mortar-pestle",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "lahore-weavers",
    description: "Solid cast brass mortar and pestle forged in Gujranwala metal foundries. Designed for effortless hand-crushing of whole Pakistani spices, cardamom pods, and ginger-garlic pastes.",
    ratingAvg: 4.92,
    ratingCount: 27,
    variants: [
      { sku: "GW-MORTAR-1.5KG", title: "1.5 kg Solid Brass", attributes: { weight: "1.5 kg" }, price: 420000, compareAt: 490000, stock: 15 },
      { sku: "GW-MORTAR-2.5KG", title: "2.5 kg Solid Brass Heavy", attributes: { weight: "2.5 kg" }, price: 580000, compareAt: 680000, stock: 11 },
    ]
  },
  {
    title: "Multani Ceramic Soup & Salan Bowls (Set of 4)",
    slug: "multani-ceramic-soup-salan-bowls-set-of-4",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Hand-thrown pottery bowls glazed in indigo blue and leaf motifs. Ideal for serving daal, nihari, shorba, and halwa.",
    ratingAvg: 4.70,
    ratingCount: 11,
    variants: [
      { sku: "MK-BOWL-4SET", title: "Set of 4 Deep Bowls", attributes: { quantity: "4 Bowls", capacity: "500ml" }, price: 260000, compareAt: 320000, stock: 24 },
    ]
  },
  {
    title: "Chiniot Rosewood Carved Tissue Box Cover",
    slug: "chiniot-rosewood-carved-tissue-box-cover",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "chiniot-heritage",
    description: "Elegant slide-bottom tissue dispenser box made of dark sheesham timber with open jali carving and floral borders.",
    ratingAvg: 4.65,
    ratingCount: 9,
    variants: [
      { sku: "CH-TISSUE-STD", title: "Standard Rectangular Size", attributes: { size: "Standard" }, price: 165000, compareAt: 200000, stock: 30 },
    ]
  },
  {
    title: "Attock Terracotta Water Matka with Brass Dispenser Tap",
    slug: "attock-terracotta-water-matka-with-brass-dispenser-tap",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Natural porous clay water vessel (Matka) naturally cools drinking water through evaporative micro-pores. Equipped with a heavy brass push-tap and clay lid.",
    ratingAvg: 4.88,
    ratingCount: 17,
    variants: [
      { sku: "AT-MATKA-8L", title: "8 Litre Earthenware", attributes: { capacity: "8 Litre" }, price: 295000, compareAt: 360000, stock: 12 },
    ]
  },
  {
    title: "Swat Valley Hand-Carved Walnut Wood Book Stand (Rehal)",
    slug: "swat-valley-hand-carved-walnut-wood-book-stand-rehal",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "chiniot-heritage",
    description: "Traditional folding Rehal stand carved from single-piece aged Swat walnut wood. Decorated with intricate geometric trellis carvings. Folds completely flat.",
    ratingAvg: 4.96,
    ratingCount: 34,
    variants: [
      { sku: "SW-REHAL-12", title: "Medium 12 inch", attributes: { size: "12 inch" }, price: 240000, compareAt: 300000, stock: 20 },
      { sku: "SW-REHAL-15", title: "Large 15 inch", attributes: { size: "15 inch" }, price: 320000, compareAt: 390000, stock: 15 },
    ]
  },
  {
    title: "Multani Ceramic Handi Cooking Pot with Lid (1.5L)",
    slug: "multani-ceramic-handi-cooking-pot-with-lid-1-5l",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000008",
    brandSlug: "multan-kashikari",
    description: "Glazed stoneware Handi designed for slow-cooking mutton handi, dum biryani, and korma over gentle flames. Retains moisture and deep aromatic flavours.",
    ratingAvg: 4.82,
    ratingCount: 20,
    variants: [
      { sku: "MK-HANDI-1.5L", title: "1.5 Litre with Lid", attributes: { capacity: "1.5 Litre" }, price: 310000, compareAt: 380000, stock: 18 },
    ]
  },
  {
    title: "Handmade Brass Table Bell with Camel Bone Handle",
    slug: "handmade-brass-table-bell-with-camel-bone-handle",
    sellerId: "a1111111-1111-1111-1111-111111111111",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "lahore-weavers",
    description: "Polished golden brass service bell with turned camel bone grip and clear resonant acoustic tone. A classic Pakistani desk and dining accent.",
    ratingAvg: 4.70,
    ratingCount: 8,
    variants: [
      { sku: "BR-BELL-STD", title: "Single Standard Bell", attributes: { material: "Solid Brass" }, price: 145000, compareAt: 180000, stock: 25 },
    ]
  },

  // Seller 2: Khyber Heritage Leather (13 products)
  {
    title: "Peshawari Chappal - Traditional Leather Kaptaan Edition",
    slug: "peshawari-chappal-traditional-leather-kaptaan-edition",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000007",
    brandSlug: "khyber-craft",
    description: "Iconic Kaptaan cut Peshawari chappal hand-crafted in Namak Mandi, Peshawar. Made from full-grain buff calfskin leather with comfortable memory padded insole and durable tyre tread sole.",
    ratingAvg: 4.94,
    ratingCount: 65,
    variants: [
      { sku: "KHY-KAP-BLK-41", title: "Matte Black - Size 41", attributes: { color: "Matte Black", size: "41" }, price: 420000, compareAt: 520000, stock: 20 },
      { sku: "KHY-KAP-BLK-42", title: "Matte Black - Size 42", attributes: { color: "Matte Black", size: "42" }, price: 420000, compareAt: 520000, stock: 25 },
      { sku: "KHY-KAP-BRN-42", title: "Mustard Tan - Size 42", attributes: { color: "Mustard Tan", size: "42" }, price: 420000, compareAt: 520000, stock: 18 },
    ]
  },
  {
    title: "Peshawari Norozi Double-Sole Handcrafted Chappal",
    slug: "peshawari-norozi-double-sole-handcrafted-chappal",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000007",
    brandSlug: "khyber-craft",
    description: "The classic Norozi design famous for its prominent front cross-cut and heavyweight double tire sole. Hand-stitched with waxed linen thread by generational cobblers.",
    ratingAvg: 4.88,
    ratingCount: 39,
    variants: [
      { sku: "KHY-NOR-CHOC-42", title: "Chocolate Brown - Size 42", attributes: { color: "Chocolate Brown", size: "42" }, price: 480000, compareAt: 590000, stock: 14 },
      { sku: "KHY-NOR-CHOC-43", title: "Chocolate Brown - Size 43", attributes: { color: "Chocolate Brown", size: "43" }, price: 480000, compareAt: 590000, stock: 16 },
    ]
  },
  {
    title: "Sialkot Handcrafted Full-Grain Leather Messenger Laptop Bag",
    slug: "sialkot-handcrafted-full-grain-leather-messenger-laptop-bag",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b1000000-0000-0000-0000-000000000002",
    brandSlug: "khyber-craft",
    description: "15.6-inch laptop briefcase bag tanned in Sialkot with vegetable extracts. Features antique brass YKK hardware, padded laptop compartment, and an adjustable canvas-reinforced shoulder strap.",
    ratingAvg: 4.91,
    ratingCount: 26,
    variants: [
      { sku: "SKT-BAG-TAN-15", title: "Vintage Tan 15.6\"", attributes: { color: "Vintage Tan", size: "15.6 inch" }, price: 950000, compareAt: 1200000, stock: 12 },
      { sku: "SKT-BAG-DKBRN-15", title: "Dark Walnut 15.6\"", attributes: { color: "Dark Walnut", size: "15.6 inch" }, price: 950000, compareAt: 1200000, stock: 8 },
    ]
  },
  {
    title: "Balochi Hand-Embroidered Traditional Men's Waistcoat",
    slug: "balochi-hand-embroidered-traditional-mens-waistcoat",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000005",
    brandSlug: "khyber-craft",
    description: "Royal Balochi ceremonial vest richly embroidered with silk threads and micro mirror needlework (Sheesha dozi) on premium midnight blue velvet fabric.",
    ratingAvg: 4.87,
    ratingCount: 18,
    variants: [
      { sku: "BL-VEST-MED-BLUE", title: "Midnight Blue - Medium (38-40)", attributes: { size: "Medium", color: "Midnight Blue" }, price: 680000, compareAt: 850000, stock: 10 },
      { sku: "BL-VEST-LRG-BLUE", title: "Midnight Blue - Large (42-44)", attributes: { size: "Large", color: "Midnight Blue" }, price: 680000, compareAt: 850000, stock: 12 },
      { sku: "BL-VEST-MED-MAROON", title: "Deep Maroon - Medium (38-40)", attributes: { size: "Medium", color: "Deep Maroon" }, price: 680000, compareAt: 850000, stock: 8 },
    ]
  },
  {
    title: "Traditional Kolhapuri Tilla Embroidered Khussa for Men",
    slug: "traditional-kolhapuri-tilla-embroidered-khussa-for-men",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000007",
    brandSlug: "khyber-craft",
    description: "Artisanal men's celebratory wedding khussa adorned with metallic gold tilla thread embroidery. Crafted from genuine goat leather with cushioned footbed.",
    ratingAvg: 4.78,
    ratingCount: 23,
    variants: [
      { sku: "KH-KHUSSA-GLD-41", title: "Gold Tilla - Size 41", attributes: { color: "Gold", size: "41" }, price: 320000, compareAt: 390000, stock: 15 },
      { sku: "KH-KHUSSA-GLD-42", title: "Gold Tilla - Size 42", attributes: { color: "Gold", size: "42" }, price: 320000, compareAt: 390000, stock: 18 },
    ]
  },
  {
    title: "Handcrafted Vegetable Tanned Bifold Leather Wallet",
    slug: "handcrafted-vegetable-tanned-bifold-leather-wallet",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b1000000-0000-0000-0000-000000000002",
    brandSlug: "khyber-craft",
    description: "Slimline pocket wallet crafted from 100% full-grain cowhide leather. Holds 8 cards, currency bill partition, and RFID blocking lining for daily security.",
    ratingAvg: 4.89,
    ratingCount: 45,
    variants: [
      { sku: "WL-BIFOLD-COGNAC", title: "Cognac Brown", attributes: { color: "Cognac Brown" }, price: 185000, compareAt: 240000, stock: 40 },
      { sku: "WL-BIFOLD-ONYX", title: "Onyx Black", attributes: { color: "Onyx Black" }, price: 185000, compareAt: 240000, stock: 35 },
    ]
  },
  {
    title: "Pure Karakul Wool Jinnah Cap (Traditional Qaraqul)",
    slug: "pure-karakul-wool-jinnah-cap-traditional-qaraqul",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000005",
    brandSlug: "khyber-craft",
    description: "The distinguished Qaraqul fleece cap famously worn by Quaid-e-Azam Muhammad Ali Jinnah. Hand-shaped with velvet interior lining and authentic curl luster.",
    ratingAvg: 4.96,
    ratingCount: 30,
    variants: [
      { sku: "KQ-CAP-BLK-58", title: "Black Fleece - 58 cm", attributes: { color: "Black", size: "58 cm" }, price: 540000, compareAt: 650000, stock: 10 },
      { sku: "KQ-CAP-GRY-58", title: "Grey Astrakhan - 58 cm", attributes: { color: "Grey", size: "58 cm" }, price: 580000, compareAt: 700000, stock: 8 },
    ]
  },
  {
    title: "Namak Mandi Peshawari Zalmi Cut Chappal",
    slug: "namak-mandi-peshawari-zalmi-cut-chappal",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000007",
    brandSlug: "khyber-craft",
    description: "Youthful Zalmi cut featuring a streamlined toe box and yellow contrast welt stitching. Lightweight micro-cellular rubber sole for active daily wear.",
    ratingAvg: 4.82,
    ratingCount: 28,
    variants: [
      { sku: "KHY-ZAL-41", title: "Coal Black - Size 41", attributes: { color: "Coal Black", size: "41" }, price: 380000, compareAt: 460000, stock: 20 },
      { sku: "KHY-ZAL-42", title: "Coal Black - Size 42", attributes: { color: "Coal Black", size: "42" }, price: 380000, compareAt: 460000, stock: 22 },
    ]
  },
  {
    title: "Hand-Crafted Full-Grain Leather Belt (Solid Brass Buckle)",
    slug: "hand-crafted-full-grain-leather-belt-solid-brass-buckle",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b1000000-0000-0000-0000-000000000002",
    brandSlug: "khyber-craft",
    description: "Thick 38mm wide genuine saddle leather belt with hand-burnished edges and cast solid brass prong buckle. Built to last a lifetime.",
    ratingAvg: 4.90,
    ratingCount: 33,
    variants: [
      { sku: "BLT-TAN-34", title: "Tan - Waist 34", attributes: { color: "Tan", waist: "34 inch" }, price: 220000, compareAt: 280000, stock: 25 },
      { sku: "BLT-TAN-36", title: "Tan - Waist 36", attributes: { color: "Tan", waist: "36 inch" }, price: 220000, compareAt: 280000, stock: 20 },
      { sku: "BLT-BLK-34", title: "Black - Waist 34", attributes: { color: "Black", waist: "34 inch" }, price: 220000, compareAt: 280000, stock: 22 },
    ]
  },
  {
    title: "Gojra Handloom Heavy Khaddar Men's Unstitched Suit",
    slug: "gojra-handloom-heavy-khaddar-mens-unstitched-suit",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000005",
    brandSlug: "lahore-weavers",
    description: "7 metres of genuine winter handloom khaddar woven on traditional Pakistani wooden pit-looms in Gojra, Punjab. Pure 100% breathable organic cotton.",
    ratingAvg: 4.93,
    ratingCount: 40,
    variants: [
      { sku: "GJ-KHD-IVORY", title: "Natural Off-White / Ivory (7m)", attributes: { color: "Ivory", length: "7 metres" }, price: 360000, compareAt: 440000, stock: 30 },
      { sku: "GJ-KHD-TEAL", title: "Deep Forest Teal (7m)", attributes: { color: "Forest Teal", length: "7 metres" }, price: 390000, compareAt: 470000, stock: 18 },
    ]
  },
  {
    title: "Peshawari Traditional Leather Duffle Gym & Travel Bag",
    slug: "peshawari-traditional-leather-duffle-gym-travel-bag",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b1000000-0000-0000-0000-000000000002",
    brandSlug: "khyber-craft",
    description: "Rugged weekender holdall duffle crafted from thick distressed oil-pull calf leather. Features heavy brass foot studs, reinforced handles, and side shoe pocket.",
    ratingAvg: 4.86,
    ratingCount: 15,
    variants: [
      { sku: "DUF-BRN-50CM", title: "50cm Weekend Carry (35L)", attributes: { capacity: "35 Litre", color: "Antique Brown" }, price: 1150000, compareAt: 1450000, stock: 7 },
    ]
  },
  {
    title: "Chitrali Woolen Pakol Cap & Feather Crest",
    slug: "chitrali-woolen-pakol-cap-and-feather-crest",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b2000000-0000-0000-0000-000000000005",
    brandSlug: "khyber-craft",
    description: "Warm rolled soft woolen cap hand-spun by mountain weavers of Chitral. Keeps warmth trapped even in sub-zero winter temperatures.",
    ratingAvg: 4.92,
    ratingCount: 38,
    variants: [
      { sku: "CHIT-PAKOL-CAMEL", title: "Camel Brown Wool", attributes: { color: "Camel Brown" }, price: 160000, compareAt: 200000, stock: 35 },
      { sku: "CHIT-PAKOL-CHAR", title: "Charcoal Heather Wool", attributes: { color: "Charcoal" }, price: 160000, compareAt: 200000, stock: 25 },
    ]
  },
  {
    title: "Hand-Stitched Leather Passport Holder & Travel Wallet",
    slug: "hand-stitched-leather-passport-holder-travel-wallet",
    sellerId: "a2222222-2222-2222-2222-222222222222",
    categoryId: "b1000000-0000-0000-0000-000000000002",
    brandSlug: "khyber-craft",
    description: "Compact travel organizer holding two passports, boarding passes, currency notes, and international SIM ejector pin tool.",
    ratingAvg: 4.77,
    ratingCount: 19,
    variants: [
      { sku: "TRV-PASS-TEAL", title: "Caravan Teal Leather", attributes: { color: "Caravan Teal" }, price: 195000, compareAt: 250000, stock: 30 },
    ]
  },

  // Seller 3: Hunza Valley Organics & Textiles (13 products)
  {
    title: "Pure Hand-Woven Kashmir Pashmina Shawl (Sozni Embroidery)",
    slug: "pure-hand-woven-kashmir-pashmina-shawl-sozni-embroidery",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000006",
    brandSlug: "hunza-reserve",
    description: "Ultra-fine Grade A Himalayan Cashmere wool shawl spun by hand in Kashmir and the northern high valleys. Embellished with delicate Sozni needlepoint borders that took over 80 hours of meticulous hand-weaving.",
    ratingAvg: 4.98,
    ratingCount: 52,
    variants: [
      { sku: "HNZ-PASH-IVORY", title: "Natural Ivory White (2m x 1m)", attributes: { color: "Natural Ivory", dimensions: "2m x 1m" }, price: 1450000, compareAt: 1800000, stock: 10 },
      { sku: "HNZ-PASH-TEAL", title: "Deep Peacock Teal (2m x 1m)", attributes: { color: "Peacock Teal", dimensions: "2m x 1m" }, price: 1550000, compareAt: 1950000, stock: 7 },
    ]
  },
  {
    title: "Ajrak Hand-Block Printed Pure Silk Dupatta (Sindh Heritage)",
    slug: "ajrak-hand-block-printed-pure-silk-dupatta-sindh-heritage",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000006",
    brandSlug: "sindh-heritage",
    description: "Ancient 16-step natural indigo and madder root block-printed Ajrak on featherlight pure mulberry silk. Hand-stamped using carved Shisham wood blocks in Bhit Shah, Sindh.",
    ratingAvg: 4.95,
    ratingCount: 36,
    variants: [
      { sku: "SND-AJRAK-INDIGO", title: "Indigo & Terracotta (2.5 Metres)", attributes: { color: "Indigo / Terracotta", length: "2.5 Metres" }, price: 560000, compareAt: 700000, stock: 18 },
    ]
  },
  {
    title: "Hunza Valley Sun-Dried Organic Apricots & Cold-Pressed Oil Gift Box",
    slug: "hunza-valley-sun-dried-organic-apricots-cold-pressed-oil-gift-box",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000010",
    brandSlug: "hunza-reserve",
    description: "Farm-direct certified organic sun-dried sweet apricots (1kg) paired with a 250ml bottle of cold-pressed virgin apricot kernel oil rich in Vitamin E and antioxidants. Harvested from ancient high-altitude orchards along the Karakoram.",
    ratingAvg: 4.96,
    ratingCount: 68,
    variants: [
      { sku: "HNZ-APRICOT-GIFT", title: "Gift Box (1kg Apricots + 250ml Oil)", attributes: { package: "Gift Set", weight: "1.25 kg" }, price: 295000, compareAt: 360000, stock: 45 },
      { sku: "HNZ-APRICOT-2KG", title: "Family Bulk Pack (2kg Dried Apricots)", attributes: { package: "Bulk Pack", weight: "2 kg" }, price: 340000, compareAt: 420000, stock: 30 },
    ]
  },
  {
    title: "Gilgit Wild Mountain Blossom Raw Honeycomb (Natural 800g)",
    slug: "gilgit-wild-mountain-blossom-raw-honeycomb-800g",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000010",
    brandSlug: "hunza-reserve",
    description: "Raw unprocessed mountain honey harvested directly with natural beeswax honeycomb from wild Apis dorsata bee colonies feeding on alpine wildflowers.",
    ratingAvg: 4.97,
    ratingCount: 75,
    variants: [
      { sku: "GLG-HONEY-COMB-800G", title: "800g Glass Hex Jar with Comb", attributes: { weight: "800g", packaging: "Hex Jar" }, price: 380000, compareAt: 460000, stock: 35 },
      { sku: "GLG-HONEY-JAR-1.5KG", title: "1.5kg Family Jar with Comb", attributes: { weight: "1.5kg", packaging: "Pantry Tub" }, price: 620000, compareAt: 750000, stock: 20 },
    ]
  },
  {
    title: "Himalayan Pink Rock Salt Culinary Cooking Slab & Ceramic Grinder",
    slug: "himalayan-pink-rock-salt-culinary-cooking-slab-ceramic-grinder",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000010",
    brandSlug: "hunza-reserve",
    description: "100% natural Khewra salt slab (8\" x 12\" x 2\") suitable for searing steaks, grilling tikka, and chilled sushi presentation. Includes a refillable ceramic spice grinder filled with coarse pink salt crystals.",
    ratingAvg: 4.88,
    ratingCount: 31,
    variants: [
      { sku: "KHW-SALT-SLAB-SET", title: "Cooking Slab + Grinder Set", attributes: { weight: "4.5 kg", slabSize: "8x12x2 inch" }, price: 315000, compareAt: 390000, stock: 25 },
    ]
  },
  {
    title: "Hand-Embroidered Zari Phulkari Velvet Shawl (Lahore Heritage)",
    slug: "hand-embroidered-zari-phulkari-velvet-shawl-lahore-heritage",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000006",
    brandSlug: "lahore-weavers",
    description: "Opulent micro-velvet bridal wrap adorned with heavy antique gold Zari thread work and traditional Punjabi Phulkari floral medallions. Border finished with classic Kiran fringe lace.",
    ratingAvg: 4.92,
    ratingCount: 29,
    variants: [
      { sku: "LHR-PHUL-MAROON", title: "Royal Maroon Velvet (2.5m)", attributes: { color: "Royal Maroon", fabric: "Micro Velvet" }, price: 790000, compareAt: 980000, stock: 12 },
      { sku: "LHR-PHUL-EMERALD", title: "Emerald Green Velvet (2.5m)", attributes: { color: "Emerald Green", fabric: "Micro Velvet" }, price: 790000, compareAt: 980000, stock: 10 },
    ]
  },
  {
    title: "Skardu Karakoram Mountain Wild Green Tea & Herbs (Tin 250g)",
    slug: "skardu-karakoram-mountain-wild-green-tea-herbs-tin-250g",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000010",
    brandSlug: "hunza-reserve",
    description: "Sun-dried wild thyme (tumuro), peppermint, and loose-leaf highland green tea harvested above 2,500m elevation. Caffeine-free soothing kahwa blend.",
    ratingAvg: 4.85,
    ratingCount: 44,
    variants: [
      { sku: "SKR-TEA-TIN-250G", title: "Airtight Keepsake Tin (250g)", attributes: { weight: "250g" }, price: 165000, compareAt: 210000, stock: 50 },
    ]
  },
  {
    title: "Bahawalpur Chunri Silk Stole (Hand-Tied Bandhani)",
    slug: "bahawalpur-chunri-silk-stole-hand-tied-bandhani",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000006",
    brandSlug: "sindh-heritage",
    description: "Authentic Cholistan desert Chunri tie-dyed on fine crushed silk. Thousands of tiny hand-tied knots dyed in vibrant festive shades of saffron, fuchsia, and mustard.",
    ratingAvg: 4.84,
    ratingCount: 24,
    variants: [
      { sku: "BHW-CHUNRI-SAFF", title: "Saffron & Magenta Fiesta", attributes: { color: "Saffron / Magenta" }, price: 345000, compareAt: 420000, stock: 22 },
    ]
  },
  {
    title: "Sindhi Ralli Patchwork Quilt (Handmade King Bedspread)",
    slug: "sindhi-ralli-patchwork-quilt-handmade-king-bedspread",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b1000000-0000-0000-0000-000000000003",
    brandSlug: "sindh-heritage",
    description: "Heritage hand-quilted Ralli created by rural artisan women in lower Sindh. Features hundreds of pieced geometric cotton triangles with running kantha stitches.",
    ratingAvg: 4.90,
    ratingCount: 16,
    variants: [
      { sku: "SND-RALLI-KING", title: "King Size (90 x 100 inch)", attributes: { size: "King Bedspread", dimensions: "90x100 inch" }, price: 850000, compareAt: 1050000, stock: 8 },
    ]
  },
  {
    title: "Organic Kasuri Methi & Peshawari Garam Masala Spice Pack",
    slug: "organic-kasuri-methi-peshawari-garam-masala-spice-pack",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000010",
    brandSlug: "hunza-reserve",
    description: "Fragrant shade-dried fenugreek leaves from Kasur, Punjab bundled with stone-ground Peshawar whole spice garam masala (black cumin, mace, cinnamon, star anise).",
    ratingAvg: 4.91,
    ratingCount: 53,
    variants: [
      { sku: "KSR-SPICE-COMBO", title: "Duo Pack (200g Methi + 250g Masala)", attributes: { weight: "450g Total" }, price: 185000, compareAt: 230000, stock: 40 },
    ]
  },
  {
    title: "Sindhi Mirror-Work (Sheesha) Hand-Embroidered Tote Bag",
    slug: "sindhi-mirror-work-sheesha-hand-embroidered-tote-bag",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b1000000-0000-0000-0000-000000000001",
    brandSlug: "sindh-heritage",
    description: "Durable canvas shoulder tote embellished with tribal mirror embroidery, brass charms, and leather handles. Spacious interior with zipped security pocket.",
    ratingAvg: 4.79,
    ratingCount: 21,
    variants: [
      { sku: "SND-TOTE-ECRU", title: "Ecru Canvas with Indigo Stitching", attributes: { color: "Ecru / Indigo" }, price: 245000, compareAt: 310000, stock: 25 },
    ]
  },
  {
    title: "Naran Valley Hand-Knitted Warm Woolen Socks (Pair of 3)",
    slug: "naran-valley-hand-knitted-warm-woolen-socks-pair-of-3",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000006",
    brandSlug: "hunza-reserve",
    description: "Extra-thick mountain wool socks hand-knitted on circular needles by women cooperatives in Naran and Kaghan. Natural thermal insulation for chilly winter floors.",
    ratingAvg: 4.88,
    ratingCount: 37,
    variants: [
      { sku: "NRN-SOCK-3SET", title: "Set of 3 Assorted Earth Tones", attributes: { quantity: "3 Pairs", size: "Free Size" }, price: 165000, compareAt: 210000, stock: 45 },
    ]
  },
  {
    title: "Rawalpindi Brass Samovar Tea Urn (Charcoal Heated 4L)",
    slug: "rawalpindi-brass-samovar-tea-urn-charcoal-heated-4l",
    sellerId: "a3333333-3333-3333-3333-333333333333",
    categoryId: "b2000000-0000-0000-0000-000000000009",
    brandSlug: "lahore-weavers",
    description: "Magnificent traditional brass samovar tea boiler with center chimney for hot charcoal embers. Decorated with embossed paisley filigree and twin wooden side handles.",
    ratingAvg: 4.96,
    ratingCount: 14,
    variants: [
      { sku: "RAW-SAMOVAR-4L", title: "4 Litre Banquet Samovar", attributes: { capacity: "4 Litre", material: "Cast Brass" }, price: 1650000, compareAt: 2100000, stock: 6 },
    ]
  }
];

function sqlEscape(str) {
  if (str === null || str === undefined) return "NULL";
  let s = String(str).replace(/\\'/g, "'").replace(/\\"/g, '"');
  s = s.replace(/'/g, "''");
  return `'${s}'`;
}

function sqlJson(obj) {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  const jsonStr = JSON.stringify(obj);
  return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
}

function generateSql() {
  const sql = [];
  sql.push("-- =============================================================================");
  sql.push("-- Kaaravan Marketplace — Phase 4 Demo Data");
  sql.push("-- 10 Categories (2 levels), 3 Approved Sellers, 40 Products + Variants");
  sql.push("-- Money stored in paisa (bigint). Images mapped to local /demo/ placeholder assets.");
  sql.push("-- NOTE: Run with 'pnpm dlx supabase db query --linked -f supabase/demo/demo_data.sql' ONLY AFTER APPROVAL");
  sql.push("-- =============================================================================");
  sql.push("");
  sql.push("BEGIN;");
  sql.push("");

  const demoDir = path.resolve(process.cwd(), "public/demo");
  const usedImages = [];
  const placeholderImages = [];

  function recordImage(resolvedPath, isPlaceholder) {
    usedImages.push(resolvedPath);
    if (isPlaceholder) {
      placeholderImages.push(resolvedPath);
    }
    return resolvedPath;
  }

  // 1. Profiles for the 3 demo sellers
  sql.push("-- 1. DEMO SELLER PROFILES");
  sql.push("-- Setting role = 'seller' on existing auth users");
  sql.push("INSERT INTO public.profiles (id, full_name, phone, role, status)");
  sql.push("VALUES");
  sql.push("  ('10def90d-80e6-49d0-8ee4-b49c2a476367', 'Tariq Mehmood Khan', '+920000000001', 'seller', 'active'),");
  sql.push("  ('caf061d7-2d72-4edd-8a8e-a0817f297fe7', 'Gul Khan Afridi', '+920000000002', 'seller', 'active'),");
  sql.push("  ('39d5d603-a839-443c-8547-5c2139a49c5b', 'Yasmin Begum Hunzai', '+920000000003', 'seller', 'active')");
  sql.push("ON CONFLICT (id) DO UPDATE SET");
  sql.push("  role = 'seller'::role_type,");
  sql.push("  status = 'active',");
  sql.push("  full_name = EXCLUDED.full_name,");
  sql.push("  phone = EXCLUDED.phone;");
  sql.push("");

  // 2. Approved Demo Sellers
  sql.push("-- 2. APPROVED DEMO SELLERS");
  sql.push("INSERT INTO public.sellers (id, owner_profile_id, business_name, slug, logo, description, business_type, status, commission_rate_bps, return_window_days, rating_avg)");
  sql.push("VALUES");
  sql.push(`  ('a1111111-1111-1111-1111-111111111111', '10def90d-80e6-49d0-8ee4-b49c2a476367', 'Multan Kashikari & Crafts', 'multan-kashikari', '${recordImage('/demo/seller-kashikari.svg', false)}', 'Master artisans of authentic Multani blue pottery, hand-carved camel skin lamps, and traditional ceramic tableware.', 'Artisan Guild', 'approved', 800, 7, 4.90),`);
  sql.push(`  ('a2222222-2222-2222-2222-222222222222', 'caf061d7-2d72-4edd-8a8e-a0817f297fe7', 'Khyber Heritage Leather', 'khyber-heritage-leather', '${recordImage('/demo/seller-peshawar-leather.svg', false)}', 'Handmade Peshawari chappals, Norozi sandals, and premium full-grain buffalo leather goods crafted in Namak Mandi, Peshawar.', 'Heritage Workshop', 'approved', 750, 7, 4.85),`);
  sql.push(`  ('a3333333-3333-3333-3333-333333333333', '39d5d603-a839-443c-8547-5c2139a49c5b', 'Hunza Valley Organics & Textiles', 'hunza-organics-textiles', '${recordImage('/demo/seller-hunza-organics.svg', false)}', 'Pure mountain blossom honey, sun-dried apricots, hand-spun Pashmina shawls, and wild herbs from Gilgit-Baltistan.', 'Cooperative Enterprise', 'approved', 600, 10, 4.95)`);
  sql.push("ON CONFLICT (id) DO UPDATE SET");
  sql.push("  business_name = EXCLUDED.business_name,");
  sql.push("  slug = EXCLUDED.slug,");
  sql.push("  logo = EXCLUDED.logo,");
  sql.push("  description = EXCLUDED.description,");
  sql.push("  status = 'approved',");
  sql.push("  rating_avg = EXCLUDED.rating_avg;");
  sql.push("");

  function resolveProductImage(pNum) {
    const webpName = `prod-${pNum}.webp`;
    if (fs.existsSync(path.join(demoDir, webpName))) {
      return recordImage(`/demo/${webpName}`, false);
    }
    return recordImage(`/demo/prod-${pNum}.svg`, true);
  }

  function resolveCategoryImage(cat) {
    const candidate1 = `cat-${cat.slug}.webp`;
    const candidate2 = cat.fallbackSvg.replace(/\.svg$/, ".webp");
    if (fs.existsSync(path.join(demoDir, candidate1))) {
      return recordImage(`/demo/${candidate1}`, false);
    }
    if (fs.existsSync(path.join(demoDir, candidate2))) {
      return recordImage(`/demo/${candidate2}`, false);
    }
    return recordImage(`/demo/${cat.fallbackSvg}`, true);
  }

  function resolveBannerImage(banner) {
    const candidate1 = `banner-${banner.num}.webp`;
    const candidate2 = banner.fallbackSvg.replace(/\.svg$/, ".webp");
    if (fs.existsSync(path.join(demoDir, candidate1))) {
      return recordImage(`/demo/${candidate1}`, false);
    }
    if (fs.existsSync(path.join(demoDir, candidate2))) {
      return recordImage(`/demo/${candidate2}`, false);
    }
    return recordImage(`/demo/${banner.fallbackSvg}`, true);
  }

  function resolveBrandLogo(brand) {
    const candidate1 = `cat-${brand.catSlug}.webp`;
    const candidate2 = brand.fallbackSvg.replace(/\.svg$/, ".webp");
    if (fs.existsSync(path.join(demoDir, candidate1))) {
      return recordImage(`/demo/${candidate1}`, false);
    }
    if (fs.existsSync(path.join(demoDir, candidate2))) {
      return recordImage(`/demo/${candidate2}`, false);
    }
    return recordImage(`/demo/${brand.fallbackSvg}`, true);
  }

  // 3. Brands
  sql.push("-- 3. BRANDS");
  sql.push("INSERT INTO public.brands (id, name, slug, logo)");
  sql.push("VALUES");
  const brandsData = [
    { id: "d1000000-0000-0000-0000-000000000001", name: "Multan Kashikari", slug: "multan-kashikari", fallbackSvg: "cat-blue-pottery.svg", catSlug: "blue-pottery-ceramics" },
    { id: "d1000000-0000-0000-0000-000000000002", name: "Chiniot Heritage", slug: "chiniot-heritage", fallbackSvg: "cat-brass-woodcraft.svg", catSlug: "brass-woodcraft" },
    { id: "d1000000-0000-0000-0000-000000000003", name: "Khyber Craft", slug: "khyber-craft", fallbackSvg: "cat-handcrafted-footwear.svg", catSlug: "handcrafted-footwear" },
    { id: "d1000000-0000-0000-0000-000000000004", name: "Hunza Mountain Reserve", slug: "hunza-reserve", fallbackSvg: "cat-pure-spices.svg", catSlug: "pure-spices-honey" },
    { id: "d1000000-0000-0000-0000-000000000005", name: "Sindh Heritage", slug: "sindh-heritage", fallbackSvg: "cat-womens-artisanal.svg", catSlug: "womens-artisanal" },
    { id: "d1000000-0000-0000-0000-000000000006", name: "Lahore Weavers Guild", slug: "lahore-weavers", fallbackSvg: "cat-apparel.svg", catSlug: "apparel-textiles" },
  ];
  const brandLines = brandsData.map((b, idx) => {
    const isLast = idx === brandsData.length - 1;
    const img = resolveBrandLogo(b);
    return `  ('${b.id}', ${sqlEscape(b.name)}, '${b.slug}', '${img}')${isLast ? '' : ','}`;
  });
  sql.push(brandLines.join("\n"));
  sql.push("ON CONFLICT (id) DO UPDATE SET");
  sql.push("  name = EXCLUDED.name,");
  sql.push("  slug = EXCLUDED.slug,");
  sql.push("  logo = EXCLUDED.logo;");
  sql.push("");

  // 4. Categories (10 categories in 2 levels)
  sql.push("-- 4. 10 CATEGORIES IN 2 LEVELS");
  sql.push("-- Level 1 (Parents)");
  sql.push("INSERT INTO public.categories (id, parent_id, name, slug, image, sort_order, commission_rate_bps, is_active)");
  sql.push("VALUES");
  const categoriesLevel1 = [
    { id: "b1000000-0000-0000-0000-000000000001", name: "Apparel & Textiles", slug: "apparel-textiles", fallbackSvg: "cat-apparel.svg", sortOrder: 1, commissionBps: 600 },
    { id: "b1000000-0000-0000-0000-000000000002", name: "Leather & Footwear", slug: "leather-footwear", fallbackSvg: "cat-leather.svg", sortOrder: 2, commissionBps: 700 },
    { id: "b1000000-0000-0000-0000-000000000003", name: "Home & Pottery", slug: "home-pottery", fallbackSvg: "cat-home.svg", sortOrder: 3, commissionBps: 750 },
    { id: "b1000000-0000-0000-0000-000000000004", name: "Spices & Organic Foods", slug: "spices-organic", fallbackSvg: "cat-spices.svg", sortOrder: 4, commissionBps: 500 },
  ];
  const parentLines = categoriesLevel1.map((cat, idx) => {
    const isLast = idx === categoriesLevel1.length - 1;
    const img = resolveCategoryImage(cat);
    return `  ('${cat.id}', NULL, ${sqlEscape(cat.name)}, '${cat.slug}', '${img}', ${cat.sortOrder}, ${cat.commissionBps}, TRUE)${isLast ? '' : ','}`;
  });
  sql.push(parentLines.join("\n"));
  sql.push("ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, image = EXCLUDED.image, is_active = TRUE;");
  sql.push("");

  sql.push("-- Level 2 (Subcategories)");
  sql.push("INSERT INTO public.categories (id, parent_id, name, slug, image, sort_order, commission_rate_bps, is_active)");
  sql.push("VALUES");
  const categoriesLevel2 = [
    { id: "b2000000-0000-0000-0000-000000000005", parentId: "b1000000-0000-0000-0000-000000000001", name: "Men's Traditional Wear", slug: "mens-traditional", fallbackSvg: "cat-mens-traditional.svg", sortOrder: 1, commissionBps: 600 },
    { id: "b2000000-0000-0000-0000-000000000006", parentId: "b1000000-0000-0000-0000-000000000001", name: "Women's Artisanal Shawls & Dupattas", slug: "womens-artisanal", fallbackSvg: "cat-womens-artisanal.svg", sortOrder: 2, commissionBps: 600 },
    { id: "b2000000-0000-0000-0000-000000000007", parentId: "b1000000-0000-0000-0000-000000000002", name: "Handcrafted Heritage Footwear", slug: "handcrafted-footwear", fallbackSvg: "cat-handcrafted-footwear.svg", sortOrder: 3, commissionBps: 700 },
    { id: "b2000000-0000-0000-0000-000000000008", parentId: "b1000000-0000-0000-0000-000000000003", name: "Multan Blue Pottery & Ceramics", slug: "blue-pottery-ceramics", fallbackSvg: "cat-blue-pottery.svg", sortOrder: 4, commissionBps: 750 },
    { id: "b2000000-0000-0000-0000-000000000009", parentId: "b1000000-0000-0000-0000-000000000003", name: "Brass, Copper & Woodcraft", slug: "brass-woodcraft", fallbackSvg: "cat-brass-woodcraft.svg", sortOrder: 5, commissionBps: 750 },
    { id: "b2000000-0000-0000-0000-000000000010", parentId: "b1000000-0000-0000-0000-000000000004", name: "Pure Mountain Spices & Honey", slug: "pure-spices-honey", fallbackSvg: "cat-pure-spices.svg", sortOrder: 6, commissionBps: 500 },
  ];
  const subLines = categoriesLevel2.map((cat, idx) => {
    const isLast = idx === categoriesLevel2.length - 1;
    const img = resolveCategoryImage(cat);
    return `  ('${cat.id}', '${cat.parentId}', ${sqlEscape(cat.name)}, '${cat.slug}', '${img}', ${cat.sortOrder}, ${cat.commissionBps}, TRUE)${isLast ? '' : ','}`;
  });
  sql.push(subLines.join("\n"));
  sql.push("ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, image = EXCLUDED.image, is_active = TRUE;");
  sql.push("");

  // 5. Banners
  sql.push("-- 5. HOME BANNERS");
  sql.push("INSERT INTO public.banners (id, title, image_url, link_url, sort_order, is_active)");
  sql.push("VALUES");
  const bannersData = [
    { id: "e1000000-0000-0000-0000-000000000001", num: 1, title: "Handcrafted Across Pakistan", fallbackSvg: "banner-caravan-1.svg", linkUrl: "/category/home-pottery", sortOrder: 1 },
    { id: "e1000000-0000-0000-0000-000000000002", num: 2, title: "Pure Mountain Harvests", fallbackSvg: "banner-caravan-2.svg", linkUrl: "/category/spices-organic", sortOrder: 2 },
    { id: "e1000000-0000-0000-0000-000000000003", num: 3, title: "The Heritage Leatherwork", fallbackSvg: "banner-caravan-3.svg", linkUrl: "/category/leather-footwear", sortOrder: 3 },
  ];
  const bannerLines = bannersData.map((b, idx) => {
    const isLast = idx === bannersData.length - 1;
    const img = resolveBannerImage(b);
    return `  ('${b.id}', ${sqlEscape(b.title)}, '${img}', '${b.linkUrl}', ${b.sortOrder}, TRUE)${isLast ? '' : ','}`;
  });
  sql.push(bannerLines.join("\n"));
  sql.push("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, is_active = TRUE;");
  sql.push("");

  // 6. Products & Variants & Images
  sql.push("-- 6. 40 ACTIVE PRODUCTS + 1-3 VARIANTS EACH");
  sql.push("-- Delete previous detail image rows for demo products");
  sql.push("DELETE FROM public.product_images WHERE id::text LIKE '91000000-0000-____-0000-000000000002';");
  sql.push("");

  const brandMap = {
    "multan-kashikari": "d1000000-0000-0000-0000-000000000001",
    "chiniot-heritage": "d1000000-0000-0000-0000-000000000002",
    "khyber-craft": "d1000000-0000-0000-0000-000000000003",
    "hunza-reserve": "d1000000-0000-0000-0000-000000000004",
    "sindh-heritage": "d1000000-0000-0000-0000-000000000005",
    "lahore-weavers": "d1000000-0000-0000-0000-000000000006",
  };

  productsList.forEach((p, idx) => {
    const pNum = idx + 1;
    const pUuid = `c1000000-0000-0000-0000-${String(pNum).padStart(12, "0")}`;
    const brandId = brandMap[p.brandSlug] || "NULL";
    const brandSql = brandId === "NULL" ? "NULL" : `'${brandId}'`;

    sql.push(`-- Product #${pNum}: ${p.title.replace(/'/g, "''")}`);
    sql.push(`INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)`);
    sql.push(`VALUES ('${pUuid}', '${p.sellerId}', '${p.categoryId}', ${brandSql}, ${sqlEscape(p.title)}, '${p.slug}', ${sqlEscape(p.description)}, 'active', ${p.ratingAvg}, ${p.ratingCount})`);
    sql.push(`ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;`);
    sql.push("");

    // Variants
    p.variants.forEach((v, vIdx) => {
      const vNum = vIdx + 1;
      const vUuid = `f1000000-0000-${String(pNum).padStart(4, "0")}-0000-${String(vNum).padStart(12, "0")}`;
      sql.push(`INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)`);
      sql.push(`VALUES ('${vUuid}', '${pUuid}', '${v.sku}', ${sqlJson(v.attributes)}, ${v.price}, ${v.compareAt || "NULL"}, 'PKR', ${v.stock}, TRUE)`);
      sql.push(`ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;`);
    });
    sql.push("");

    // Images: dynamically resolves to .webp if present in public/demo/, otherwise falls back to placeholder .svg
    const img1Uuid = `91000000-0000-${String(pNum).padStart(4, "0")}-0000-000000000001`;
    const imagePath = resolveProductImage(pNum);
    sql.push(`INSERT INTO public.product_images (id, product_id, path, sort_order)`);
    sql.push(`VALUES ('${img1Uuid}', '${pUuid}', '${imagePath}', 1)`);
    sql.push(`ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;`);
    sql.push("");
  });

  const customerId = "cc7ff7ac-a8ee-43ca-85cb-2750bf0beb81";
  const addressObj = {
    fullName: "Demo Customer",
    phone: "+920000000004",
    province: "Punjab",
    city: "Lahore",
    area: "Gulberg III",
    street: "House 1, Street 1",
    postalCode: "54660"
  };
  const addressSql = sqlJson(addressObj);

  sql.push("-- 7. DEMO CUSTOMER & ORDERS");
  sql.push("-- Customer profile");
  sql.push("INSERT INTO public.profiles (id, full_name, phone, role, status)");
  sql.push(`VALUES ('${customerId}', 'Demo Customer', '+920000000004', 'customer', 'active')`);
  sql.push("ON CONFLICT (id) DO UPDATE SET role = 'customer'::role_type, status = 'active', full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;");
  sql.push("");

  sql.push("INSERT INTO public.orders (id, order_number, profile_id, shipping_address, billing_address, payment_method, payment_status, subtotal_minor, shipping_minor, total_minor)");
  sql.push("VALUES");
  sql.push(`  ('71000000-0000-0000-0000-000000000001', 'ORD-DEMO-001', '${customerId}', ${addressSql}, ${addressSql}, 'cod', 'pending', 345000, 25000, 370000),`);
  sql.push(`  ('71000000-0000-0000-0000-000000000002', 'ORD-DEMO-002', '${customerId}', ${addressSql}, ${addressSql}, 'card', 'paid', 420000, 25000, 445000),`);
  sql.push(`  ('71000000-0000-0000-0000-000000000003', 'ORD-DEMO-003', '${customerId}', ${addressSql}, ${addressSql}, 'cod', 'paid', 1450000, 25000, 1475000)`);
  sql.push("ON CONFLICT (order_number) DO UPDATE SET payment_status = EXCLUDED.payment_status;");
  sql.push("");

  sql.push("INSERT INTO public.sub_orders (id, order_id, seller_id, status, subtotal_minor, shipping_minor, total_minor)");
  sql.push("VALUES");
  sql.push(`  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'pending', 345000, 25000, 370000),`);
  sql.push(`  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'a2222222-2222-2222-2222-222222222222', 'shipped', 420000, 25000, 445000),`);
  sql.push(`  ('72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003', 'a3333333-3333-3333-3333-333333333333', 'delivered', 1450000, 25000, 1475000)`);
  sql.push("ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;");
  sql.push("");

  sql.push("INSERT INTO public.order_items (id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_minor, quantity, line_total_minor)");
  sql.push("VALUES");
  sql.push(`  ('73000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'f1000000-0000-0001-0000-000000000001', 'Multani Handcrafted Blue Pottery Flower Vase (Kashikari 10\")', '{"color": "Cobalt Blue", "size": "10 inch"}'::jsonb, 345000, 1, 345000),`);
  sql.push(`  ('73000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000002', 'f1000000-0000-0015-0000-000000000001', 'Peshawari Chappal - Traditional Leather Kaptaan Edition', '{"color": "Matte Black", "size": "41"}'::jsonb, 420000, 1, 420000),`);
  sql.push(`  ('73000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000003', 'f1000000-0000-0028-0000-000000000001', 'Pure Hand-Woven Kashmir Pashmina Shawl (Sozni Embroidery)', '{"color": "Natural Ivory", "dimensions": "2m x 1m"}'::jsonb, 1450000, 1, 1450000)`);
  sql.push("ON CONFLICT (id) DO NOTHING;");
  sql.push("");

  sql.push("INSERT INTO public.order_status_history (id, sub_order_id, from_status, to_status, note, created_at)");
  sql.push("VALUES");
  sql.push(`  ('74000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'awaiting_confirmation', 'pending', 'Demo setup', NOW()),`);
  sql.push(`  ('74000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000002', 'pending', 'shipped', 'Demo setup', NOW() - INTERVAL '1 day'),`);
  sql.push(`  ('74000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000003', 'shipped', 'delivered', 'Demo setup', NOW() - INTERVAL '2 days')`);
  sql.push("ON CONFLICT (id) DO NOTHING;");
  sql.push("");

  sql.push("COMMIT;");
  sql.push("");
  return {
    sql: sql.join("\n"),
    usedImages,
    placeholderImages
  };
}

const { sql: sqlOutput, usedImages, placeholderImages } = generateSql();
const outPath = path.resolve(process.cwd(), "supabase/demo/demo_data.sql");
fs.writeFileSync(outPath, sqlOutput, "utf8");
console.log(`Generated demo data SQL: ${outPath} (${sqlOutput.length} bytes)`);

// Verification of all referenced image paths
console.log("\n=== IMAGE PATH VERIFICATION ===");
let missingCount = 0;
const uniqueImages = [...new Set(usedImages)];
for (const imgPath of uniqueImages) {
  const diskPath = path.resolve(process.cwd(), `public${imgPath}`);
  if (!fs.existsSync(diskPath)) {
    console.error(`ERROR: Path does not exist on disk: ${imgPath} -> ${diskPath}`);
    missingCount++;
  }
}

if (missingCount === 0) {
  console.log(`SUCCESS: All ${uniqueImages.length} unique image paths verified to exist on disk.`);
} else {
  console.error(`FAILED: ${missingCount} image paths are missing on disk!`);
  process.exit(1);
}

const uniquePlaceholders = [...new Set(placeholderImages)];
console.log(`\nImages currently resolved to WebP: ${uniqueImages.length - uniquePlaceholders.length}`);
console.log(`Images still on SVG placeholders: ${uniquePlaceholders.length}`);
if (uniquePlaceholders.length > 0) {
  console.log("\nList of paths still on SVG placeholders:");
  uniquePlaceholders.forEach((p, idx) => console.log(`  ${idx + 1}. ${p}`));
}

