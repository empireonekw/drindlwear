import { ObjectId } from "mongodb";
import { Readable } from "stream";

import { imageBucket, ImageMeta, IMAGE_BUCKET } from "@/lib/server/images";
import { getDb } from "@/lib/server/mongodb";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/** Serves one product photo stored in MongoDB (GridFS). Public. */
async function handleGET(_request: Request, { params }: { params: { id: string } }) {
  if (!/^[a-f0-9]{24}$/i.test(params.id)) return notFound();
  try {
    const id = new ObjectId(params.id);
    const db = await getDb();
    const file = await db.collection(`${IMAGE_BUCKET}.files`).findOne({ _id: id });
    if (!file) return notFound();
    const meta = file.metadata as ImageMeta | undefined;
    const contentType = meta?.contentType ?? "application/octet-stream";
    if (!contentType.startsWith("image/")) return notFound();

    const stream = (await imageBucket()).openDownloadStream(id);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.length),
        // A photo never changes once uploaded (a new upload gets a new id).
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    noteError(error);
    console.error("Could not serve photo:", error instanceof Error ? error.message : error);
    return notFound();
  }
}

export const GET = withMetrics("images", handleGET);
