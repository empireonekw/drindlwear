import { Readable } from "stream";

import { getAdmin } from "@/lib/server/auth";
import { cleanFileName, imageBucket, ImageMeta, imageUrl, IMAGE_BUCKET, MAX_IMAGE_BYTES, sniffImageType } from "@/lib/server/images";
import { getDb } from "@/lib/server/mongodb";
import { hit, jsonError, jsonOk, tooMany, windows } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** Uploads per admin per hour. */
const UPLOADS_PER_HOUR = 200;

/** Upload one product photo (multipart field "file"). Admins only. */
async function handlePOST(request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Only admins can upload photos.");

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_IMAGE_BYTES + 64 * 1024) return jsonError(413, "Photos must be 5 MB or smaller.");
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
      return jsonError(415, "Unsupported request.");
    }

    const limit = await hit("upload", admin._id.toHexString(), windows.hours(1));
    if (limit.count > UPLOADS_PER_HOUR) return tooMany(limit.expiresAt, "Upload limit reached. Try again later.");

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return jsonError(400, "Choose a photo to upload.");
    if (file.size === 0) return jsonError(400, "That file is empty.");
    if (file.size > MAX_IMAGE_BYTES) return jsonError(413, "Photos must be 5 MB or smaller.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = sniffImageType(bytes);
    if (!contentType) return jsonError(415, "Only JPEG, PNG and WebP photos are accepted.");

    const bucket = await imageBucket();
    const metadata: ImageMeta = {
      contentType,
      uploadedBy: admin._id.toHexString(),
      originalName: cleanFileName(file.name),
    };
    const upload = bucket.openUploadStream(metadata.originalName, { metadata });
    await new Promise<void>((resolve, reject) => {
      Readable.from(Buffer.from(bytes)).pipe(upload).on("finish", () => resolve()).on("error", reject);
    });

    return jsonOk(
      { id: upload.id.toString(), url: imageUrl(upload.id), name: metadata.originalName, size: file.size },
      201,
    );
  } catch (error) {
    noteError(error);
    console.error("Photo upload failed:", error instanceof Error ? error.message : error);
    return jsonError(500, "The photo could not be saved. Please try again.");
  }
}

/** The most recent uploaded photos, for the admin photo library. Admins only. */
async function handleGET(_request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Only admins can see uploaded photos.");
    const db = await getDb();
    const files = await db
      .collection(`${IMAGE_BUCKET}.files`)
      .find({}, { projection: { filename: 1, length: 1, uploadDate: 1 } })
      .sort({ uploadDate: -1 })
      .limit(60)
      .toArray();
    return jsonOk({
      images: files.map((file) => ({
        id: file._id.toString(),
        url: imageUrl(file._id),
        name: file.filename as string,
        size: file.length as number,
        uploadedAt: (file.uploadDate as Date).toISOString(),
      })),
    });
  } catch (error) {
    noteError(error);
    console.error("Could not list photos:", error instanceof Error ? error.message : error);
    return jsonError(500, "Could not load the photo library.");
  }
}

export const POST = withMetrics("uploads", handlePOST);
export const GET = withMetrics("uploads", handleGET);
