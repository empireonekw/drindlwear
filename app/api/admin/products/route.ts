import { getAdmin } from "@/lib/server/auth";
import { createProduct, MAX_PRODUCT_BYTES, validateProduct } from "@/lib/server/products";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** Adds a product: body { product }. Admins only. */
async function handlePOST(request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Only admins can add products.");

    const parsed = await readJsonBody(request, MAX_PRODUCT_BYTES);
    if ("response" in parsed) return parsed.response;
    const checked = validateProduct(parsed.body.product);
    if ("error" in checked) return jsonError(400, checked.error);

    return jsonOk({ product: await createProduct(checked.product) }, 201);
  } catch (error) {
    noteError(error);
    console.error("Could not add product:", error instanceof Error ? error.message : error);
    return jsonError(500, "The product could not be saved. Please try again.");
  }
}

export const POST = withMetrics("products", handlePOST);
