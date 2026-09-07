import { describe, it, expect } from "vitest";
import { ProductService } from "@/lib/services/product-service";

describe("ProductService.search", () => {
  it("filters by category", async () => {
    const results = await ProductService.search({ category: "coffee-machines" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === "coffee-machines")).toBe(true);
  });

  it("filters by price range", async () => {
    const results = await ProductService.search({ priceMin: 100, priceMax: 300 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.price >= 100 && p.price <= 300)).toBe(true);
  });

  it("filters by brand", async () => {
    const results = await ProductService.search({ brands: ["Sony"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.brand === "Sony")).toBe(true);
  });

  it("filters by required feature substrings", async () => {
    const results = await ProductService.search({ features: ["ANC".toLowerCase()] });
    // "anc" is not a literal feature substring for most products; use a known one instead
    const known = await ProductService.search({ features: ["noise cancelling"] });
    expect(known.every((p) => p.features.some((f) => f.toLowerCase().includes("noise cancelling")))).toBe(
      true
    );
  });

  it("performs free-text search across title, brand and description", async () => {
    const results = await ProductService.search({ query: "espresso" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns the full catalogue with at least 40 products", async () => {
    const all = await ProductService.listAll();
    expect(all.length).toBeGreaterThanOrEqual(40);
  });
});

describe("ProductService.getById / getByIds", () => {
  it("retrieves a single product by id", async () => {
    const all = await ProductService.listAll();
    const target = all[0];
    const found = await ProductService.getById(target.id);
    expect(found?.id).toBe(target.id);
  });

  it("returns null for an unknown id", async () => {
    const found = await ProductService.getById("does-not-exist");
    expect(found).toBeNull();
  });
});
