import { listProducts } from "@/lib/server/products";
import { jsonError, jsonOk } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** The whole catalogue, for the storefront. Public. */
async function handleGET(_request: Request) {
  try {
    return jsonOk({ products: await listProducts() });
  } catch (error) {
    noteError(error);
    console.error("Could not load products:", error instanceof Error ? error.message : error);
    return jsonError(503, "Products are unavailable right now.");
  }
}

export const GET = withMetrics("products", handleGET);
