import { products } from "../data/products";
import type { Product, ProductCategory, Availability } from "../types";

/**
 * ProductService
 * ---------------
 * The single boundary between the rest of the app and product data.
 * Today it reads from a local, deterministic demo catalogue
 * (src/lib/data/products.ts). In production this is the module you would
 * swap to call a real product data provider / merchant API — every other
 * service depends only on this interface, never on the data source itself.
 */

export interface ProductSearchFilters {
  category?: ProductCategory;
  query?: string;
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  features?: string[];
  availability?: Availability[];
  minRating?: number;
}

class ProductServiceImpl {
  /** Returns the full demo catalogue. Swap for a paginated remote fetch later. */
  async listAll(): Promise<Product[]> {
    return products;
  }

  async getById(id: string): Promise<Product | null> {
    return products.find((p) => p.id === id) ?? null;
  }

  async getByIds(ids: string[]): Promise<Product[]> {
    const set = new Set(ids);
    return products.filter((p) => set.has(p.id));
  }

  async listByCategory(category: ProductCategory): Promise<Product[]> {
    return products.filter((p) => p.category === category);
  }

  /** Central search/filter entry point. Kept out of React components on purpose. */
  async search(filters: ProductSearchFilters): Promise<Product[]> {
    let results = [...products];

    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (typeof filters.priceMin === "number") {
      results = results.filter((p) => p.price >= filters.priceMin!);
    }

    if (typeof filters.priceMax === "number") {
      results = results.filter((p) => p.price <= filters.priceMax!);
    }

    if (filters.brands?.length) {
      const brandSet = new Set(filters.brands.map((b) => b.toLowerCase()));
      results = results.filter((p) => brandSet.has(p.brand.toLowerCase()));
    }

    if (filters.features?.length) {
      results = results.filter((p) =>
        filters.features!.every((f) =>
          p.features.some((pf) => pf.toLowerCase().includes(f.toLowerCase()))
        )
      );
    }

    if (filters.availability?.length) {
      const set = new Set(filters.availability);
      results = results.filter((p) => set.has(p.availability));
    }

    if (typeof filters.minRating === "number") {
      results = results.filter((p) => p.rating >= filters.minRating!);
    }

    return results;
  }

  async listCategories(): Promise<{ category: ProductCategory; count: number }[]> {
    const map = new Map<ProductCategory, number>();
    for (const p of products) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }

  async listBrandsForCategory(category: ProductCategory): Promise<string[]> {
    const set = new Set(products.filter((p) => p.category === category).map((p) => p.brand));
    return Array.from(set).sort();
  }
}

export const ProductService = new ProductServiceImpl();
