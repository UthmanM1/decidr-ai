import "server-only";
import type { MerchantClickEvent } from "../types";
import { generateId } from "../utils";
import { createClient } from "../supabase/server";
import { getMerchantById } from "../data/merchants";
import { ProductService } from "./product-service";
import { AnalyticsService } from "./analytics-service";

/**
 * MerchantTrackingService
 * ------------------------
 * The only place that knows how to record an outbound merchant click and
 * resolve a safe redirect target. The affiliate/tracking URL logic never
 * lives in a client component — the browser only ever calls
 * `/api/merchant-click`, which delegates here.
 */

const memoryClicks: MerchantClickEvent[] = [];

class MerchantTrackingServiceImpl {
  /**
   * Records the click and returns a *validated* redirect URL. Only ever
   * redirects to a known merchant's own domain — never to an arbitrary
   * user-supplied URL, to avoid open-redirect vulnerabilities.
   */
  async recordClickAndGetRedirect(params: {
    userId: string | null;
    sessionId: string;
    recommendationId?: string;
    productId: string;
    source: MerchantClickEvent["source"];
  }): Promise<{ redirectUrl: string } | { error: string }> {
    const product = await ProductService.getById(params.productId);
    if (!product) return { error: "Product not found" };

    const merchant = getMerchantById(product.merchantId);
    if (!merchant) return { error: "Merchant not found" };

    const event: MerchantClickEvent = {
      id: generateId("click"),
      userId: params.userId,
      sessionId: params.sessionId,
      recommendationId: params.recommendationId,
      productId: params.productId,
      merchantId: merchant.id,
      timestamp: new Date().toISOString(),
      source: params.source
    };

    memoryClicks.push(event);

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("merchant_clicks").insert({
          id: event.id,
          user_id: event.userId,
          session_id: event.sessionId,
          recommendation_id: event.recommendationId ?? null,
          product_id: event.productId,
          merchant_id: event.merchantId,
          source: event.source,
          created_at: event.timestamp
        });
      }
    } catch {
      // Tracking failure must never block the redirect.
    }

    await AnalyticsService.track(
      "merchant_clicked",
      { productId: product.id, merchantId: merchant.id, source: params.source },
      params.userId,
      params.sessionId
    );

    // Validate the URL actually belongs to the merchant's declared domain
    // before redirecting, as a defence-in-depth measure against tampering.
    let safeUrl: URL;
    try {
      safeUrl = new URL(product.affiliateUrl);
    } catch {
      return { error: "Invalid merchant URL" };
    }

    const allowedHosts = ["track.decidr.example", merchant.domain];
    if (!allowedHosts.includes(safeUrl.hostname)) {
      return { error: "Redirect target not recognised" };
    }

    return { redirectUrl: safeUrl.toString() };
  }

  getMemoryClicks(): MerchantClickEvent[] {
    return memoryClicks;
  }
}

export const MerchantTrackingService = new MerchantTrackingServiceImpl();
