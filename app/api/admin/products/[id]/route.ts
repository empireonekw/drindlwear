import { getAdmin } from "@/lib/server/auth";
import { deleteProduct, MAX_PRODUCT_BYTES, updateProduct, validateProduct } from "@/lib/server/products";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/**
 * Changes one product. Only POST reaches the API (see middleware.ts), so the
 * body says what to do: { action: "update", product } or { action: "delete" }.
 * Admins only.
 */
async function handlePOST(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Only admins can change products.");

    const id = Number(params.id);
    if (!/^\d{1,9}$/.test(params.id) || !Number.isSafeInteger(id)) return jsonError(404, "Product not found.");

    const parsed = await readJsonBody(request, MAX_PRODUCT_BYTES);
    if ("response" in parsed) return parsed.response;
    const { body } = parsed;

    if (body.action === "delete") {
      return (await deleteProduct(id)) ? jsonOk({ ok: true }) : jsonError(404, "Product not found.");
    }
    if (body.action === "update") {
      const checked = validateProduct(body.product);
      if ("error" in checked) return jsonError(400, checked.error);
      const product = await updateProduct(id, checked.product);
      return product ? jsonOk({ product }) : jsonError(404, "Product not found.");
    }
    return jsonError(400, "Invalid request.");
  } catch (error) {
    noteError(error);
    console.error("Could not change product:", error instanceof Error ? error.message : error);
    return jsonError(500, "The product could not be saved. Please try again.");
  }
}

export const POST = withMetrics("products", handlePOST);
