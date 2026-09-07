import { describe, it, expect, beforeEach } from "vitest";

describe("MerchantTrackingService.recordClickAndGetRedirect", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("returns a redirect URL for a known product and records the click", async () => {
    const { MerchantTrackingService } = await import("@/lib/services/merchant-tracking-service");
    const { products } = await import("@/lib/data/products");
    const product = products[0];

    const before = MerchantTrackingService.getMemoryClicks().length;
    const result = await MerchantTrackingService.recordClickAndGetRedirect({
      userId: null,
      sessionId: "sess_click_test",
      productId: product.id,
      source: "recommendation_card"
    });

    expect("redirectUrl" in result).toBe(true);
    if ("redirectUrl" in result) {
      expect(result.redirectUrl).toContain("track.decidr.example");
    }
    expect(MerchantTrackingService.getMemoryClicks().length).toBe(before + 1);
  });

  it("returns an error for an unknown product id", async () => {
    const { MerchantTrackingService } = await import("@/lib/services/merchant-tracking-service");
    const result = await MerchantTrackingService.recordClickAndGetRedirect({
      userId: null,
      sessionId: "sess_click_test_2",
      productId: "not-a-real-product",
      source: "product_detail"
    });
    expect("error" in result).toBe(true);
  });

  it("records the correct merchant id for the clicked product", async () => {
    const { MerchantTrackingService } = await import("@/lib/services/merchant-tracking-service");
    const { products } = await import("@/lib/data/products");
    const product = products.find((p) => p.category === "running-shoes")!;

    await MerchantTrackingService.recordClickAndGetRedirect({
      userId: "user_123",
      sessionId: "sess_click_test_3",
      productId: product.id,
      source: "comparison"
    });

    const clicks = MerchantTrackingService.getMemoryClicks();
    const last = clicks[clicks.length - 1];
    expect(last.merchantId).toBe(product.merchantId);
    expect(last.userId).toBe("user_123");
  });
});
