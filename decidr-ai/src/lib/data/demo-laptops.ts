import type { Product } from "../types";

/**
 * ⚠️ DEMO / SYNTHETIC DATA — NOT A REAL PRODUCT FEED ⚠️
 * -------------------------------------------------------
 * This is a small, self-contained catalogue used ONLY by the local demo
 * engine (src/lib/demo-engine.ts). It intentionally does NOT depend on
 * ProductService, Supabase, or any network call, so the guided demo can run
 * reliably offline, in any environment, with zero configuration.
 *
 * It is separate from the main catalogue in src/lib/data/products.ts (which
 * backs the real /discover flow when a user types their own request). Prices,
 * ratings and specs below are synthetic and for demonstration purposes only —
 * no real commercial or affiliate relationship is implied.
 *
 * Each entry is a valid `Product`, plus four extra 0-100 attribute scores
 * (performanceScore, portabilityScore, batteryScore, gamingScore) that the
 * demo's deterministic scoring engine reads directly — no LLM involved.
 */
export interface DemoLaptop extends Product {
  performanceScore: number;
  portabilityScore: number;
  batteryScore: number;
  gamingScore: number;
}

const now = "2026-01-15T09:00:00.000Z";
const merchantId = "merchant_demo_electronics";

function laptop(l: Omit<DemoLaptop, "currency" | "category" | "merchantId" | "createdAt" | "updatedAt" | "productUrl" | "affiliateUrl" | "image">): DemoLaptop {
  return {
    ...l,
    category: "laptops",
    currency: "GBP",
    merchantId,
    productUrl: `https://demoelectronics.example/products/${l.id}`,
    affiliateUrl: `https://track.decidr.example/out?ref=${l.id}`,
    image: `https://picsum.photos/seed/${l.id}/640/480`,
    createdAt: now,
    updatedAt: now
  };
}

export const demoLaptops: DemoLaptop[] = [
  laptop({
    id: "demo_laptop_air_m3",
    title: "AirBook 13 M3",
    brand: "Northwind",
    subcategory: "ultrabook",
    price: 1099,
    rating: 4.8,
    reviewCount: 3210,
    description: "A fanless 13-inch ultrabook favouring battery life and portability over raw sustained performance.",
    specifications: { CPU: "N3 8-core", RAM: "16GB", Storage: "512GB SSD", Weight: "1.24kg", Battery: "18 hours" },
    features: ["Fanless silent design", "18-hour battery", "1080p webcam", "Thunderbolt/USB4"],
    availability: "in_stock",
    performanceScore: 68,
    portabilityScore: 95,
    batteryScore: 96,
    gamingScore: 25
  }),
  laptop({
    id: "demo_laptop_xps_plus",
    title: "Edge 13 Plus",
    brand: "Vantar",
    subcategory: "ultrabook",
    price: 1249,
    rating: 4.5,
    reviewCount: 1876,
    description: "A premium Windows ultrabook with a dense 13.4-inch display, aimed at professionals who want a compact daily driver.",
    specifications: { CPU: "Core Ultra 7", RAM: "16GB", Storage: "512GB SSD", Weight: "1.26kg", Battery: "12 hours" },
    features: ["OLED display option", "Haptic trackpad", "Thunderbolt 4"],
    availability: "in_stock",
    performanceScore: 78,
    portabilityScore: 90,
    batteryScore: 70,
    gamingScore: 30
  }),
  laptop({
    id: "demo_laptop_thinkline_carbon",
    title: "ThinkLine Carbon 12",
    brand: "Orbis",
    subcategory: "business",
    price: 1399,
    rating: 4.7,
    reviewCount: 2510,
    description: "A business-grade carbon-fibre laptop with a strong reliability track record and a spill-resistant keyboard.",
    specifications: { CPU: "Core Ultra 7", RAM: "32GB", Storage: "1TB SSD", Weight: "1.12kg", Battery: "15 hours" },
    features: ["MIL-STD tested", "Rapid charge", "IR camera"],
    availability: "in_stock",
    performanceScore: 80,
    portabilityScore: 92,
    batteryScore: 84,
    gamingScore: 28
  }),
  laptop({
    id: "demo_laptop_swiftgo",
    title: "SwiftGo 14",
    brand: "Halcyon",
    subcategory: "budget-university",
    price: 749,
    rating: 4.3,
    reviewCount: 1420,
    description: "A budget-friendly aluminium laptop that balances portability and price, popular with students who need a dependable everyday machine.",
    specifications: { CPU: "Core 5", RAM: "16GB", Storage: "512GB SSD", Weight: "1.3kg", Battery: "10 hours" },
    features: ["OLED display", "Backlit keyboard", "Fingerprint reader"],
    availability: "in_stock",
    performanceScore: 55,
    portabilityScore: 85,
    batteryScore: 62,
    gamingScore: 20
  }),
  laptop({
    id: "demo_laptop_proart_studio",
    title: "StudioBook Pro 16",
    brand: "Kestrel",
    subcategory: "workstation",
    price: 2199,
    rating: 4.6,
    reviewCount: 640,
    description: "A creator-focused mobile workstation with a discrete GPU for demanding rendering and development workloads.",
    specifications: { CPU: "Core i9", RAM: "32GB", Storage: "1TB SSD", GPU: "RTX 4060", Weight: "2.4kg" },
    features: ["Discrete GPU", "Colour-accurate display", "Large 90Wh battery"],
    availability: "in_stock",
    performanceScore: 96,
    portabilityScore: 35,
    batteryScore: 55,
    gamingScore: 88
  }),
  laptop({
    id: "demo_laptop_spectre_x360",
    title: "Spectra X360 14",
    brand: "Vantar",
    subcategory: "2-in-1",
    price: 1329,
    rating: 4.4,
    reviewCount: 980,
    description: "A convertible 2-in-1 laptop designed for people who switch between typing, sketching and presenting.",
    specifications: { CPU: "Core Ultra 7", RAM: "16GB", Storage: "1TB SSD", Weight: "1.36kg", Battery: "13 hours" },
    features: ["360-degree hinge", "Included stylus", "OLED touchscreen"],
    availability: "in_stock",
    performanceScore: 74,
    portabilityScore: 87,
    batteryScore: 76,
    gamingScore: 32
  }),
  laptop({
    id: "demo_laptop_g15_gaming",
    title: "Vector G15",
    brand: "Kestrel",
    subcategory: "gaming",
    price: 1249,
    rating: 4.4,
    reviewCount: 1780,
    description: "A mainstream gaming laptop with a dedicated GPU, built for gaming first and portability second.",
    specifications: { CPU: "Core i7", RAM: "16GB", Storage: "1TB SSD", GPU: "RTX 4050", Weight: "2.5kg", Battery: "6 hours" },
    features: ["144Hz display", "Dedicated GPU", "RGB keyboard"],
    availability: "in_stock",
    performanceScore: 88,
    portabilityScore: 30,
    batteryScore: 35,
    gamingScore: 92
  }),
  laptop({
    id: "demo_laptop_zenlight_14",
    title: "ZenLight 14",
    brand: "Halcyon",
    subcategory: "ultrabook",
    price: 999,
    rating: 4.5,
    reviewCount: 2040,
    description: "A well-balanced everyday laptop for study and light development work, with dependable all-day battery life.",
    specifications: { CPU: "Ryzen 7", RAM: "16GB", Storage: "512GB SSD", Weight: "1.29kg", Battery: "14 hours" },
    features: ["Lightweight chassis", "Fast charge", "Backlit keyboard"],
    availability: "in_stock",
    performanceScore: 70,
    portabilityScore: 88,
    batteryScore: 82,
    gamingScore: 38
  }),
  laptop({
    id: "demo_laptop_devbook_pro",
    title: "DevBook Pro 15",
    brand: "Orbis",
    subcategory: "developer",
    price: 1599,
    rating: 4.7,
    reviewCount: 1120,
    description: "A developer-oriented laptop with a high core-count CPU and ample RAM for local builds, containers and IDEs.",
    specifications: { CPU: "Core Ultra 9", RAM: "32GB", Storage: "1TB SSD", Weight: "1.7kg", Battery: "11 hours" },
    features: ["High core-count CPU", "32GB RAM standard", "Dual SSD slots"],
    availability: "in_stock",
    performanceScore: 90,
    portabilityScore: 65,
    batteryScore: 66,
    gamingScore: 58
  }),
  laptop({
    id: "demo_laptop_traveler_air",
    title: "Traveler Air 13",
    brand: "Northwind",
    subcategory: "ultra-portable",
    price: 899,
    rating: 4.3,
    reviewCount: 1560,
    description: "An ultra-portable, low-weight laptop aimed at students who prioritise carrying it around campus all day.",
    specifications: { CPU: "Core 5", RAM: "8GB", Storage: "512GB SSD", Weight: "1.05kg", Battery: "16 hours" },
    features: ["Sub-1.1kg chassis", "16-hour battery", "Fast wake"],
    availability: "in_stock",
    performanceScore: 48,
    portabilityScore: 97,
    batteryScore: 90,
    gamingScore: 15
  }),
  laptop({
    id: "demo_laptop_balance_15",
    title: "Balance 15",
    brand: "Orbis",
    subcategory: "all-rounder",
    price: 1199,
    rating: 4.6,
    reviewCount: 2210,
    description: "An all-rounder 15-inch laptop that balances development performance, light gaming and portability without excelling narrowly at one.",
    specifications: { CPU: "Core Ultra 7", RAM: "16GB", Storage: "1TB SSD", GPU: "RTX 4050 (low power)", Weight: "1.65kg", Battery: "12 hours" },
    features: ["Dedicated entry GPU", "16-hour balanced mode", "Aluminium chassis"],
    availability: "in_stock",
    performanceScore: 82,
    portabilityScore: 72,
    batteryScore: 74,
    gamingScore: 66
  }),
  laptop({
    id: "demo_laptop_essential_14",
    title: "Essential 14",
    brand: "Halcyon",
    subcategory: "budget",
    price: 649,
    rating: 4.1,
    reviewCount: 2870,
    description: "An entry-level laptop for basic study tasks and browsing, not intended for heavier development or gaming workloads.",
    specifications: { CPU: "Core 3", RAM: "8GB", Storage: "256GB SSD", Weight: "1.5kg", Battery: "9 hours" },
    features: ["Lightweight for its price", "Compact charger"],
    availability: "low_stock",
    performanceScore: 32,
    portabilityScore: 74,
    batteryScore: 55,
    gamingScore: 10
  })
];
