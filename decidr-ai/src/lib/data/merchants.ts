import type { Merchant } from "../types";

/**
 * DEMO / PORTFOLIO DATA ONLY.
 * These merchants are synthetic and do not represent real commercial
 * partnerships or affiliate relationships. See ARCHITECTURE.md for how a real
 * merchant/affiliate network would be connected in production.
 */
export const merchants: Merchant[] = [
  { id: "merchant_demo_electronics", name: "Demo Electronics", domain: "demoelectronics.example", status: "active" },
  { id: "merchant_demo_home", name: "Demo Home", domain: "demohome.example", status: "active" },
  { id: "merchant_demo_sports", name: "Demo Sports", domain: "demosports.example", status: "active" },
  { id: "merchant_demo_marketplace", name: "Demo Marketplace", domain: "demomarketplace.example", status: "active" }
];

export function getMerchantById(id: string): Merchant | undefined {
  return merchants.find((m) => m.id === id);
}
